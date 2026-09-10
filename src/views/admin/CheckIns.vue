<script setup>
import { ref, computed, onMounted } from "vue";
import { adminApi } from "@/api/admin.js";
import QRCodeScanner from "@/components/ticket/QRCodeScanner.vue";
import { formatDateTime } from "@/utils/event.js";
import {
  QrCode,
  Search,
  CheckCircle2,
  TriangleAlert,
  XCircle,
  Clock,
  ArrowUpRight,
  UserCheck,
  X,
  Scan,
  RefreshCw,
  Ticket,
  User,
  CalendarDays,
  Recycle,
  KeyRound,
} from "lucide-vue-next";

const loading = ref(true);
const error = ref(null);

const searchQuery = ref("");
const selectedStatus = ref("All");

const checkIns = ref([]);

async function fetchCheckIns() {
  loading.value = true;
  error.value = null;
  try {
    const response = await adminApi.getCheckIns();
    checkIns.value = (response.data || []).map((c) => ({
      id: c.id,
      booking_number: c.booking?.booking_number || "N/A",
      attendee: c.booking?.user?.name || "Unknown",
      email: c.booking?.user?.email || "",
      event: c.booking?.event?.title || "N/A",
      checked_by: c.checkedBy?.name || "Unknown",
      checked_in_at: c.checked_in_at ? new Date(c.checked_in_at).toLocaleString() : "N/A",
      status: c.status,
    }));
  } catch (e) {
    error.value = e.response?.data?.message || e.message || "Failed to load check-ins.";
  } finally {
    loading.value = false;
  }
}

onMounted(fetchCheckIns);

const stats = computed(() => {
  const total = checkIns.value.length;
  const verified = checkIns.value.filter(
    (c) => c.status !== "cancelled" && c.status !== "duplicate"
  ).length;
  const rate = total ? Math.round((verified / total) * 100) : 0;
  const today = new Date().toDateString();
  const todays = checkIns.value.filter(
    (c) => c.checked_in_at && new Date(c.checked_in_at).toDateString() === today
  ).length;
  const duplicates = checkIns.value.filter((c) => c.status === "duplicate").length;

  return [
    {
      label: "Total Check-Ins",
      value: total.toLocaleString(),
      change: `${todays} today`,
      icon: QrCode,
      color: "bg-indigo-50 text-indigo-600",
    },
    {
      label: "Verified Entries",
      value: verified.toLocaleString(),
      change: total ? `${rate}% acceptance rate` : "based on issued tickets",
      icon: UserCheck,
      color: "bg-emerald-50 text-emerald-600",
    },
    {
      label: "Duplicate Attempts",
      value: duplicates.toLocaleString(),
      change: "flagged & rejected at gates",
      icon: CheckCircle2,
      color: "bg-blue-50 text-blue-600",
    },
  ];
});

const statusStyle = {
  checked_in: "bg-emerald-50 text-emerald-700 border-emerald-200",
  completed: "bg-emerald-50 text-emerald-700 border-emerald-200",
  valid: "bg-sky-50 text-sky-700 border-sky-200",
  duplicate: "bg-rose-50 text-rose-700 border-rose-200",
  cancelled: "bg-slate-100 text-slate-500 border-slate-200",
};

const filteredCheckIns = computed(() => {
  return checkIns.value.filter((c) => {
    const q = searchQuery.value.toLowerCase();
    const matchesSearch =
      c.booking_number.toLowerCase().includes(q) ||
      c.attendee.toLowerCase().includes(q) ||
      c.event.toLowerCase().includes(q) ||
      c.checked_by.toLowerCase().includes(q);

    const matchesStatus =
      selectedStatus.value === "All" || c.status === selectedStatus.value;

    return matchesSearch && matchesStatus;
  });
});

/* ───────────── QR scan → auto check-in (single-step) ───────────── */

const isScanModalOpen = ref(false);
const scanKey = ref(0);
const scanStep = ref("idle"); // idle | loading | checked | already | invalid | error
const scannedRaw = ref("");
const lookup = ref(null);
const scanError = ref("");

function openScanModal() {
  resetScan();
  isScanModalOpen.value = true;
}

function resetScan() {
  scannedRaw.value = "";
  lookup.value = null;
  scanError.value = "";
  scanStep.value = "idle";
  scanKey.value += 1;
}

/**
 * Single-step check-in: scan QR → extract token → send to backend →
 * backend validates + checks in atomically → display result.
 */
async function onScanValue(raw) {
  scannedRaw.value = raw;
  scanStep.value = "loading";
  scanError.value = "";
  lookup.value = null;

  try {
    const res = await adminApi.checkInTicket(raw);
    lookup.value = res;

    if (res.already_checked_in) {
      scanStep.value = "already";
    } else {
      scanStep.value = "checked";
      await fetchCheckIns();
    }
  } catch (e) {
    lookup.value = null;
    const body = e.response?.data;
    scanError.value = body?.message || e.message || "Check-in failed. Please try again.";

    if (body?.already_checked_in) {
      lookup.value = body;
      scanStep.value = "already";
    } else if (body?.status === "not_found") {
      scanStep.value = "invalid";
    } else {
      scanStep.value = "error";
    }
  }
}

const ticketData = computed(() => lookup.value?.data || null);
const checkInRecord = computed(() => lookup.value?.check_in || null);

const scanBanner = computed(() => {
  switch (scanStep.value) {
    case "checked":
      return { tone: "emerald", title: "CHECK-IN SUCCESSFUL", subtitle: "Ticket successfully checked in", icon: CheckCircle2 };
    case "already":
      return { tone: "amber", title: "Ticket Already Used", subtitle: "This ticket has already been checked in.", icon: TriangleAlert };
    case "invalid":
      return { tone: "rose", title: "Invalid Ticket", subtitle: "This QR code does not match any valid ticket.", icon: XCircle };
    case "error":
      return { tone: "rose", title: "Check-In Error", subtitle: scanError.value || "Something went wrong. Please try again.", icon: XCircle };
    default:
      return null;
  }
});

const bannerTitle = computed(() => scanBanner.value?.title || "");
const bannerSubtitle = computed(() => scanBanner.value?.subtitle || "");
const bannerTone = computed(() => scanBanner.value?.tone || "emerald");

function showResultPanel() {
  return ["checked", "already", "invalid", "error"].includes(scanStep.value);
}
</script>

<template>
  <main class="min-h-screen flex-1 bg-slate-50 px-8 py-8 text-slate-800">
    <!-- Header -->
    <div class="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <div class="flex items-center gap-2.5">
          <h1 class="text-3xl font-extrabold tracking-tight text-slate-900">Check-Ins Management</h1>
          <span class="rounded-md bg-indigo-100 border border-indigo-200 px-2.5 py-0.5 text-xs text-indigo-800 font-mono font-medium">
            manage_checkins
          </span>
        </div>
        <p class="mt-1 text-sm text-slate-500">Scan the ticket QR code — check-in is completed automatically.</p>
      </div>
      <div class="flex items-center gap-3">
        <button
          type="button"
          @click="openScanModal"
          class="flex items-center gap-2 rounded-lg bg-amber-500 px-4 py-2.5 text-sm font-semibold text-slate-950 shadow-sm transition-all hover:bg-amber-600 hover:shadow"
        >
          <QrCode :size="16" :stroke-width="2.5" />
          Verify & Check In
        </button>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="flex items-center justify-center py-20">
      <div class="flex items-center gap-3 text-slate-500">
        <RefreshCw :size="18" class="animate-spin" />
        <span class="text-sm font-medium">Loading check-ins...</span>
      </div>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="flex items-center justify-center py-20">
      <div class="rounded-xl border border-rose-200 bg-rose-50 p-6 text-center">
        <XCircle :size="24" class="mx-auto mb-2 text-rose-500" />
        <p class="text-sm font-semibold text-rose-700">{{ error }}</p>
        <button @click="fetchCheckIns" class="mt-3 rounded-lg bg-amber-500 px-4 py-2 text-xs font-semibold text-slate-950 hover:bg-amber-600">
          Retry
        </button>
      </div>
    </div>

    <!-- Data Loaded -->
    <template v-else>
      <!-- Stat cards -->
      <div class="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div
          v-for="stat in stats"
          :key="stat.label"
          class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
        >
          <div class="mb-4 flex items-start justify-between">
            <p class="text-xs font-semibold text-slate-500 uppercase tracking-wider">{{ stat.label }}</p>
            <span class="flex h-8 w-8 items-center justify-center rounded-lg shadow-sm" :class="stat.color">
              <component :is="stat.icon" :size="16" />
            </span>
          </div>
          <p class="text-2xl font-bold text-slate-900">{{ stat.value }}</p>
          <p class="mt-2 flex items-center gap-1 text-xs font-medium text-emerald-600">
            <ArrowUpRight :size="14" />
            {{ stat.change }}
          </p>
        </div>
      </div>

      <!-- Filter & Search Bar -->
      <div class="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div class="relative min-w-[260px] flex-1">
          <Search :size="16" class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search check-ins by booking #, attendee, event, gate..."
            class="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm text-slate-800 placeholder:text-slate-400 outline-none shadow-sm transition-all focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
          />
        </div>

        <div class="flex items-center gap-2">
          <label class="text-xs font-semibold text-slate-500">Status:</label>
          <select
            v-model="selectedStatus"
            class="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 outline-none shadow-sm focus:border-amber-500 capitalize"
          >
            <option value="All">All Statuses</option>
            <option value="checked_in">Checked In</option>
            <option value="completed">Completed</option>
            <option value="valid">Valid (Unscanned)</option>
            <option value="duplicate">Duplicate Attempt</option>
          </select>
        </div>
      </div>

      <!-- Check-Ins Table -->
      <div class="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div class="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <h2 class="text-base font-bold text-slate-900">Attendee Check-In Logs ({{ filteredCheckIns.length }})</h2>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full text-left text-sm">
            <thead class="bg-slate-50/70 border-b border-slate-200">
              <tr class="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th class="px-6 py-3">Booking / Pass #</th>
                <th class="px-6 py-3">Attendee</th>
                <th class="px-6 py-3">Checked By</th>
                <th class="px-6 py-3">Check-In Time</th>
                <th class="px-6 py-3 text-right">Status</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <tr
                v-for="c in filteredCheckIns"
                :key="c.id"
                class="transition-colors hover:bg-slate-50/80"
              >
                <td class="px-6 py-4 font-mono text-xs font-bold text-amber-600">
                  {{ c.booking_number }}
                </td>
                <td class="px-6 py-4">
                  <p class="font-semibold text-slate-900">{{ c.attendee }}</p>
                  <p class="text-[10px] text-slate-400">{{ c.email }}</p>
                </td>
                <td class="px-6 py-4 text-xs text-slate-500">
                  {{ c.checked_by }}
                </td>
                <td class="px-6 py-4 text-xs text-slate-500">
                  {{ c.checked_in_at }}
                </td>
                <td class="px-6 py-4 text-right">
                  <span class="rounded-full border px-2.5 py-0.5 text-[11px] font-semibold capitalize" :class="statusStyle[c.status]">
                    {{ c.status.replace('_', ' ') }}
                  </span>
                </td>
              </tr>
              <tr v-if="filteredCheckIns.length === 0">
                <td colspan="5" class="px-6 py-8 text-center text-sm text-slate-400">
                  No check-in records found.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </template>

    <!-- QR Scan & Check-In Modal -->
    <div
      v-if="isScanModalOpen"
      class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm"
    >
      <div class="flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
        <!-- Modal header -->
        <div class="mb-0 flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div class="flex items-center gap-2.5">
            <Scan :size="20" class="text-amber-600" />
            <h3 class="text-base font-bold text-slate-900">Scan Ticket QR</h3>
          </div>
          <button @click="isScanModalOpen = false" class="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700">
            <X :size="18" />
          </button>
        </div>

        <div class="flex-1 space-y-4 overflow-y-auto px-6 py-5">
          <!-- Scanner (auto-starts) or the loading state -->
          <QRCodeScanner
            v-if="!showResultPanel()"
            :key="scanKey"
            @scan="onScanValue"
          />

          <!-- Ticket result panel -->
          <template v-if="showResultPanel()">
            <!-- Status banner -->
            <div
              class="flex items-start gap-3 rounded-xl border p-4"
              :class="{
                'border-emerald-200 bg-emerald-50': bannerTone === 'emerald',
                'border-amber-200 bg-amber-50': bannerTone === 'amber',
                'border-rose-200 bg-rose-50': bannerTone === 'rose',
              }"
            >
              <component
                :is="scanBanner?.icon || CheckCircle2"
                :size="24"
                class="mt-0.5 shrink-0"
                :class="{
                  'text-emerald-600': bannerTone === 'emerald',
                  'text-amber-600': bannerTone === 'amber',
                  'text-rose-600': bannerTone === 'rose',
                }"
              />
              <div class="min-w-0">
                <p class="text-lg font-extrabold" :class="{
                  'text-emerald-800': bannerTone === 'emerald',
                  'text-amber-800': bannerTone === 'amber',
                  'text-rose-800': bannerTone === 'rose',
                }">{{ bannerTitle }}</p>
                <p class="mt-0.5 text-sm font-medium" :class="{
                  'text-emerald-700': bannerTone === 'emerald',
                  'text-amber-700': bannerTone === 'amber',
                  'text-rose-700': bannerTone === 'rose',
                }">{{ bannerSubtitle }}</p>
                <p v-if="scanStep === 'checked'" class="mt-2 flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
                  <span class="inline-flex items-center rounded-full bg-emerald-200 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-800">
                    Status: USED
                  </span>
                </p>
              </div>
            </div>

            <!-- Ticket details card (shown on success and already-used) -->
            <div v-if="ticketData" class="rounded-xl border border-slate-200 bg-slate-50/60 p-4">
              <div class="flex items-center justify-between gap-2 border-b border-slate-200 pb-3">
                <p class="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-slate-500">
                  <Ticket :size="13" /> Ticket Details
                </p>
                <span class="rounded-full border px-2.5 py-0.5 text-[11px] font-semibold uppercase"
                      :class="{
                        'border-blue-200 bg-blue-50 text-blue-700': ticketData.status === 'DONE',
                        'border-emerald-200 bg-emerald-50 text-emerald-700': ticketData.status === 'ACTIVE',
                        'border-sky-200 bg-sky-50 text-sky-700': ticketData.status === 'USED',
                        'border-amber-200 bg-amber-50 text-amber-700': ticketData.status === 'EXPIRED',
                        'border-rose-200 bg-rose-50 text-rose-700': ticketData.status === 'CANCELLED',
                        'border-violet-200 bg-violet-50 text-violet-700': ticketData.status === 'REFUNDED',
                      }"
                >
                  {{ (ticketData.status || '').toLowerCase() }}
                </span>
              </div>

              <dl class="mt-3 space-y-2.5 text-sm">
                <div class="flex items-start justify-between gap-3">
                  <dt class="flex shrink-0 items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                    <KeyRound :size="12" /> Ticket No.
                  </dt>
                  <dd class="font-mono text-xs font-bold text-amber-600">{{ ticketData.ticket_code }}</dd>
                </div>
                <div class="flex items-start justify-between gap-3">
                  <dt class="flex shrink-0 items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                    <User :size="12" /> Customer
                  </dt>
                  <dd class="text-right">
                    <p class="font-semibold text-slate-900">{{ ticketData.user?.name || "N/A" }}</p>
                    <p v-if="ticketData.user?.email" class="text-[11px] text-slate-400">{{ ticketData.user.email }}</p>
                  </dd>
                </div>
                <div class="flex items-start justify-between gap-3">
                  <dt class="flex shrink-0 items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                    <CalendarDays :size="12" /> Event
                  </dt>
                  <dd class="text-right">
                    <p class="max-w-[240px] font-semibold text-slate-900">{{ ticketData.ticket_type?.event?.title || ticketData.event?.title || "N/A" }}</p>
                    <p class="text-[11px] text-slate-400">{{ ticketData.ticket_type?.name || "" }}</p>
                  </dd>
                </div>
                <div class="flex items-start justify-between gap-3">
                  <dt class="flex shrink-0 items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                    <QrCode :size="12" /> Booking
                  </dt>
                  <dd class="font-mono text-xs text-slate-600">
                    {{ ticketData.booking?.booking_number || `#${ticketData.booking_id || ''}` }}
                  </dd>
                </div>
                <div v-if="checkInRecord" class="flex items-start justify-between gap-3">
                  <dt class="flex shrink-0 items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                    <Clock :size="12" /> Checked In
                  </dt>
                  <dd class="text-xs font-medium text-slate-700">
                    {{ formatDateTime(checkInRecord.checked_in_at) }}
                    <span v-if="checkInRecord.staff?.name" class="text-slate-400"> by {{ checkInRecord.staff.name }}</span>
                  </dd>
                </div>
              </dl>
            </div>

            <!-- Scan Another button -->
            <button
              type="button"
              @click="resetScan"
              class="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100"
            >
              <span class="flex items-center justify-center gap-1.5">
                <Recycle :size="13" /> Scan Another Ticket
              </span>
            </button>
          </template>
        </div>
      </div>
    </div>
  </main>
</template>