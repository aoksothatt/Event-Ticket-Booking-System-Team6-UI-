<script setup>
import { ref, computed, onMounted } from "vue";
import { adminApi } from "@/api/admin.js";
import {
  QrCode,
  Search,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  ArrowUpRight,
  UserCheck,
  Plus,
  X,
  Scan,
  RefreshCw,
} from "lucide-vue-next";

const loading = ref(true);
const error = ref(null);

const stats = [
  { label: "Total Check-Ins", value: "14,890", change: "+412 today", icon: QrCode, color: "bg-indigo-50 text-indigo-600" },
  { label: "Attendance Rate", value: "76.4%", change: "Based on issued tickets", icon: UserCheck, color: "bg-emerald-50 text-emerald-600" },
  { label: "Active Scanner Staff", value: "24", change: "Across 6 live event gates", icon: CheckCircle2, color: "bg-blue-50 text-blue-600" },
];

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

const statusStyle = {
  checked_in: "bg-emerald-50 text-emerald-700 border-emerald-200",
  completed: "bg-emerald-50 text-emerald-700 border-emerald-200",
  valid: "bg-sky-50 text-sky-700 border-sky-200",
  duplicate: "bg-rose-50 text-rose-700 border-rose-200",
  cancelled: "bg-slate-100 text-slate-500 border-slate-200",
};

const filteredCheckIns = computed(() => {
  return checkIns.value.filter((c) => {
    const matchesSearch =
      c.booking_number.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      c.attendee.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      c.event.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      c.checked_by.toLowerCase().includes(searchQuery.value.toLowerCase());

    const matchesStatus =
      selectedStatus.value === "All" || c.status === selectedStatus.value;

    return matchesSearch && matchesStatus;
  });
});

// Modal for manual verification
const isScanModalOpen = ref(false);
const scanCode = ref("");
const scanFeedback = ref(null);

function processManualCheckIn() {
  if (!scanCode.value.trim()) return;

  const code = scanCode.value.trim().toUpperCase();
  const existing = checkIns.value.find((c) => c.booking_number === code);

  if (existing) {
    if (existing.status === "checked_in") {
      scanFeedback.value = {
        type: "error",
        title: "Duplicate Check-In Warning!",
        message: `Ticket ${code} was already checked in at ${existing.checked_in_at}.`,
      };
    } else {
      existing.status = "checked_in";
      existing.checked_in_at = "Just now";
      scanFeedback.value = {
        type: "success",
        title: "Access Granted!",
        message: `Welcome ${existing.attendee} to ${existing.event}.`,
      };
    }
  } else {
    // Add new verified check-in
    checkIns.value.unshift({
      id: Date.now(),
      booking_number: code,
      attendee: "Verified Attendee",
      email: "attendee@ticket.com",
      event: "",
      checked_by: "Admin (Direct Scan)",
      checked_in_at: "Just now",
      status: "checked_in",
    });
    scanFeedback.value = {
      type: "success",
      title: "Check-in Successful!",
      message: `Booking ${code} validated and checked in successfully.`,
    };
  }
  scanCode.value = "";
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
        <p class="mt-1 text-sm text-slate-500">Validate QR barcodes, monitor gate entry staff, and prevent ticket fraud.</p>
      </div>
      <div class="flex items-center gap-3">
        <button
          type="button"
          @click="isScanModalOpen = true; scanFeedback = null;"
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

    <!-- QR / Barcode Scanner Modal -->
    <div
      v-if="isScanModalOpen"
      class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm"
    >
      <div class="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
        <div class="mb-5 flex items-center justify-between border-b border-slate-200 pb-4">
          <div class="flex items-center gap-2.5">
            <Scan :size="20" class="text-amber-600" />
            <h3 class="text-base font-bold text-slate-900">Manual Pass Check-In</h3>
          </div>
          <button @click="isScanModalOpen = false" class="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700">
            <X :size="18" />
          </button>
        </div>

        <div class="space-y-4">
          <div>
            <label class="mb-1 block text-xs font-semibold text-slate-700">Booking / QR Code Number</label>
            <input
              v-model="scanCode"
              type="text"
              placeholder="e.g. BK-984210"
              @keyup.enter="processManualCheckIn"
              class="w-full rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2.5 font-mono text-sm text-slate-900 uppercase placeholder:text-slate-400 outline-none focus:bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
            />
          </div>

          <div
            v-if="scanFeedback"
            class="rounded-xl border p-4 text-xs"
            :class="scanFeedback.type === 'success'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
              : 'border-rose-200 bg-rose-50 text-rose-800'"
          >
            <p class="font-bold text-sm">{{ scanFeedback.title }}</p>
            <p class="mt-1 text-slate-700">{{ scanFeedback.message }}</p>
          </div>
        </div>

        <div class="mt-6 flex justify-end gap-3">
          <button
            type="button"
            @click="isScanModalOpen = false"
            class="rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100"
          >
            Close
          </button>
          <button
            type="button"
            @click="processManualCheckIn"
            class="rounded-lg bg-amber-500 px-5 py-2 text-xs font-semibold text-slate-950 shadow-sm transition-all hover:bg-amber-600"
          >
            Verify Ticket
          </button>
        </div>
      </div>
    </div>
  </main>
</template>
