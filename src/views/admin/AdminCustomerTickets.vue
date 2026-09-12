<script setup>
import { ref, computed, onMounted } from "vue";
import { useI18n } from "vue-i18n";
import { adminApi } from "@/api/admin.js";
import {
  Ticket,
  Search,
  QrCode,
  Eye,
  XCircle,
  Loader2,
  ArrowUpRight,
  Users,
  Building2,
  Calendar,
} from "lucide-vue-next";

const { t } = useI18n();
const loading = ref(true);
const error = ref(null);
const tickets = ref([]);

const searchQuery = ref("");
const selectedStatus = ref("All");
const verifyToken = ref("");
const verifyResult = ref(null);
const verifyTicketData = ref(null);
const verifyCheckIn = ref(null);
const verifying = ref(false);
const checkingIn = ref(false);
const selectedTicket = ref(null);

const statuses = ["All", "DONE", "ACTIVE", "USED", "EXPIRED", "CANCELLED", "REFUNDED"];

const statusStyle = {
  DONE: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/15 dark:text-blue-400 dark:border-blue-500/30",
  ACTIVE: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-400 dark:border-emerald-500/30",
  USED: "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-500/15 dark:text-sky-400 dark:border-sky-500/30",
  CANCELLED: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/15 dark:text-rose-400 dark:border-rose-500/30",
  EXPIRED: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/15 dark:text-amber-400 dark:border-amber-500/30",
  REFUNDED: "bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-500/15 dark:text-violet-400 dark:border-violet-500/30",
};

function statusLabel(status) {
  const map = {
    All: t("all"),
    DONE: t("done"),
    ACTIVE: t("active"),
    USED: t("used"),
    EXPIRED: t("expired"),
    CANCELLED: t("cancelled"),
    REFUNDED: t("refunded"),
  };
  return map[status] || status;
}

const stats = computed(() => {
  const total = tickets.value.length;
  const done = tickets.value.filter((t) => t.status === "DONE").length;
  const active = tickets.value.filter((t) => t.status === "ACTIVE").length;
  const used = tickets.value.filter((t) => t.status === "USED").length;
  return [
    { label: t("total"), value: String(total), change: t("moduleStats.issuedToCustomers"), icon: Ticket, color: "bg-purple-50 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400" },
    { label: t("pending"), value: String(done), change: t("awaitingActivation"), icon: QrCode, color: "bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400" },
    { label: t("active"), value: String(active), change: t("readyCheckin"), icon: QrCode, color: "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400" },
    { label: t("used"), value: String(used), change: t("scannedUsed"), icon: Users, color: "bg-sky-50 text-sky-600 dark:bg-sky-500/10 dark:text-sky-400" },
  ];
});

function formatDate(d) {
  if (!d) return t("tbd");
  return new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

async function fetchTickets() {
  loading.value = true;
  error.value = null;
  try {
    const response = await adminApi.getTickets();
    const payload = response?.data;
    tickets.value = Array.isArray(payload) ? payload : (payload?.data || []);
  } catch (e) {
    error.value = e.response?.data?.message || e.message || t("failed");
  } finally {
    loading.value = false;
  }
}

onMounted(fetchTickets);

const filteredTickets = computed(() => {
  const q = searchQuery.value.toLowerCase();
  return tickets.value.filter((t) => {
    const matchesSearch =
      (t.ticket_code || "").toLowerCase().includes(q) ||
      (t.ticket_type?.event?.title || "").toLowerCase().includes(q) ||
      (t.user?.name || "").toLowerCase().includes(q);
    const matchesStatus = selectedStatus.value === "All" || t.status === selectedStatus.value;
    return matchesSearch && matchesStatus;
  });
});

async function verifyTicket(qrToken) {
  if (!qrToken.trim()) return;
  verifying.value = true;
  verifyResult.value = null;
  verifyTicketData.value = null;
  verifyCheckIn.value = null;
  try {
    const res = await adminApi.lookupTicket(qrToken.trim());
    verifyResult.value = {
      success: true,
      valid: res.valid,
      status: res.status,
      message: res.message,
    };
    verifyTicketData.value = res.data || null;
    verifyCheckIn.value = res.check_in || null;
  } catch (e) {
    verifyResult.value = {
      success: false,
      valid: false,
      status: "not_found",
      message: e.response?.data?.message || e.message || t("invalidTicket"),
    };
  } finally {
    verifying.value = false;
    await fetchTickets();
  }
}

async function confirmCheckIn() {
  if (!verifyTicketData.value || !verifyToken.value.trim()) return;
  checkingIn.value = true;
  try {
    const res = await adminApi.checkInTicket(verifyToken.value.trim());
    verifyResult.value = {
      success: true,
      valid: false,
      status: "checked_in",
      message: res?.message || t("checkinSuccess"),
    };
    verifyTicketData.value = res?.data || verifyTicketData.value;
    verifyCheckIn.value = res?.check_in || null;
  } catch (e) {
    const body = e.response?.data;
    const msg = body?.message || e.message || t("checkinFailed");
    if (body?.already_checked_in) {
      verifyResult.value = { success: true, valid: false, status: "used", message: msg };
      verifyCheckIn.value = body?.check_in || null;
    } else {
      verifyResult.value = { success: false, valid: false, status: "error", message: msg };
    }
  } finally {
    checkingIn.value = false;
    await fetchTickets();
  }
}

function resetVerify() {
  verifyResult.value = null;
  verifyTicketData.value = null;
  verifyCheckIn.value = null;
  verifyToken.value = "";
}

async function cancelTicket(ticket) {
  if (!confirm(t("cancelTicketConfirm"))) return;
  try {
    await adminApi.cancelTicket(ticket.id);
    await fetchTickets();
  } catch (e) {
    alert(e.response?.data?.message || e.message || t("errorMessage"));
  }
}
</script>

<template>
  <main class="min-h-screen flex-1 bg-slate-50 dark:bg-slate-900 px-8 py-8 text-slate-800 dark:text-slate-100">
    <!-- Header -->
    <div class="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <div class="flex items-center gap-2.5">
          <h1 class="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">{{ t("customerTickets") }}</h1>
          <span class="rounded-md bg-amber-100 border border-amber-200 px-2.5 py-0.5 text-xs text-amber-800 font-mono font-medium dark:bg-amber-500/15 dark:border-amber-500/30 dark:text-amber-400">
            manage_tickets
          </span>
        </div>
        <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">
          {{ t("customerTickets") }}
        </p>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
      <div v-for="n in 3" :key="n" class="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 shadow-sm animate-pulse">
        <div class="h-3 w-24 rounded bg-slate-200 dark:bg-slate-600 mb-4"></div>
        <div class="h-7 w-16 rounded bg-slate-200 dark:bg-slate-600 mb-2"></div>
        <div class="h-3 w-32 rounded bg-slate-100 dark:bg-slate-700"></div>
      </div>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="mb-8 rounded-xl border border-rose-200 bg-rose-50 p-6 text-center dark:border-rose-500/30 dark:bg-rose-500/10">
      <p class="text-sm font-semibold text-rose-700 dark:text-rose-400">{{ error }}</p>
      <button @click="fetchTickets" class="mt-3 text-xs font-semibold text-rose-600 underline hover:text-rose-800 dark:text-rose-400 dark:hover:text-rose-300">{{ t("retry") }}</button>
    </div>

    <template v-else>
      <!-- Stat cards -->
      <div class="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div
          v-for="stat in stats"
          :key="stat.label"
          class="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 shadow-sm"
        >
          <div class="mb-4 flex items-start justify-between">
            <p class="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{{ stat.label }}</p>
            <span class="flex h-8 w-8 items-center justify-center rounded-lg shadow-sm" :class="stat.color">
              <component :is="stat.icon" :size="16" />
            </span>
          </div>
          <p class="text-2xl font-bold text-slate-900 dark:text-white">{{ stat.value }}</p>
          <p class="mt-2 flex items-center gap-1 text-xs font-medium text-emerald-600">
            <ArrowUpRight :size="14" />
            {{ stat.change }}
          </p>
        </div>
      </div>

      <!-- Verify Panel -->
      <div class="mb-6 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 shadow-sm">
        <div class="flex flex-wrap items-center gap-3">
          <div class="w-full">
            <label class="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">{{ t("verifyCheckin") }}</label>
            <div class="flex gap-2">
              <input
                v-model="verifyToken"
                type="text"
                :placeholder="t('searchPlaceholder')"
                class="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700 px-3.5 py-2 text-sm text-slate-900 dark:text-slate-100 outline-none focus:bg-white dark:focus:bg-slate-600 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
              />
              <button
                type="button"
                :disabled="verifying || !verifyToken.trim()"
                @click="verifyTicket(verifyToken)"
                class="flex items-center gap-2 rounded-lg bg-amber-500 px-4 py-2 text-xs font-semibold text-slate-950 shadow-sm hover:bg-amber-600 disabled:opacity-50"
              >
                <Loader2 v-if="verifying" :size="14" class="animate-spin" />
                <QrCode v-else :size="14" />
                {{ t("lookup") }}
              </button>
            </div>
          </div>
        </div>

        <!-- Result message -->
        <div v-if="verifyResult" class="mt-3 rounded-lg border px-3 py-2 text-xs font-medium"
             :class="verifyResult.valid
               ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-400'
               : verifyResult.status === 'used'
                 ? 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-400'
                 : verifyResult.success && verifyResult.status === 'checked_in'
                   ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-400'
                   : 'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-400'">
          <p class="font-semibold text-sm">
            {{ verifyResult.valid ? t("validTicket")
               : verifyResult.status === "used" ? t("alreadyCheckedIn")
               : verifyResult.status === "expired" ? t("ticketExpired")
               : verifyResult.success && verifyResult.status === "checked_in" ? t("checkinSuccessful")
               : verifyResult.status === "not_found" ? t("invalidTicket")
               : t("checkinError") }}
          </p>
          <p class="mt-0.5 text-slate-700 dark:text-slate-300">{{ verifyResult.message }}</p>
          <p v-if="verifyCheckIn?.checked_in_at" class="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
            {{ t("checkedInAt") }} {{ new Date(verifyCheckIn.checked_in_at).toLocaleString() }}
          </p>
        </div>

        <!-- Ticket details -->
        <div v-if="verifyTicketData" class="mt-3 grid grid-cols-1 gap-x-4 gap-y-1.5 border-t border-slate-100 dark:border-slate-700 pt-3 text-sm sm:grid-cols-2">
          <p class="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
            <Ticket :size="13" class="text-amber-600" />
            <span class="font-mono font-bold text-slate-900 dark:text-white">{{ verifyTicketData.ticket_code }}</span>
          </p>
          <p class="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
            <Users :size="13" class="text-slate-400 dark:text-slate-500" />
            {{ verifyTicketData.user?.name || t("na") }}
          </p>
          <p class="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
            <Calendar :size="13" class="text-slate-400 dark:text-slate-500" />
            {{ verifyTicketData.ticket_type?.event?.title || t("na") }} · {{ verifyTicketData.ticket_type?.name || "" }}
          </p>
          <p class="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
            <Building2 :size="13" class="text-slate-400 dark:text-slate-500" />
            {{ t("bookingLabel") }} {{ verifyTicketData.booking?.booking_number || `#${verifyTicketData.booking_id}` }}
          </p>
          <div class="flex items-center justify-between gap-2 pt-1 sm:col-span-2">
            <span class="rounded-full border px-2.5 py-0.5 text-[11px] font-semibold capitalize"
                  :class="statusStyle[verifyTicketData.status] || 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'">
              {{ statusLabel(verifyTicketData.status) }}
            </span>
            <div class="flex gap-2">
              <button v-if="verifyResult?.valid" type="button" :disabled="checkingIn"
                      @click="confirmCheckIn"
                      class="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-60">
                <Loader2 v-if="checkingIn" :size="13" class="animate-spin" />
                {{ checkingIn ? t("checkingIn") : t("checkIn") }}
              </button>
              <button v-if="verifyResult" type="button" @click="resetVerify"
                      class="rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700">
                {{ t("reset") }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Filter & Search -->
      <div class="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 shadow-sm">
        <div class="relative min-w-[260px] flex-1">
          <Search :size="16" class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
          <input
            v-model="searchQuery"
            type="text"
            :placeholder="t('searchPlaceholder')"
            class="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 py-2 pl-9 pr-3 text-sm text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none shadow-sm transition-all focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
          />
        </div>
        <select
          v-model="selectedStatus"
          class="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs text-slate-800 dark:text-slate-100 outline-none shadow-sm focus:border-amber-500"
        >
          <option v-for="st in statuses" :key="st" :value="st">{{ st === 'All' ? t('all') : statusLabel(st) }}</option>
        </select>
      </div>

      <!-- Tickets Table -->
      <div class="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm">
        <div class="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 px-6 py-4">
          <h2 class="text-base font-bold text-slate-900 dark:text-white">{{ t("issuedTickets") }} ({{ filteredTickets.length }})</h2>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full text-left text-sm">
            <thead class="bg-slate-50/70 dark:bg-slate-700/50 border-b border-slate-200 dark:border-slate-700">
              <tr class="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                <th class="px-6 py-3">{{ t("ticketCodeHeader") }}</th>
                <th class="px-6 py-3">{{ t("customerHeader") }}</th>
                <th class="px-6 py-3">{{ t("eventTypeHeader") }}</th>
                <th class="px-6 py-3">{{ t("bookingNumberHeader") }}</th>
                <th class="px-6 py-3">{{ t("status") }}</th>
                <th class="px-6 py-3">{{ t("issuedHeader") }}</th>
                <th class="px-6 py-3 text-right">{{ t("actions") }}</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 dark:divide-slate-700">
              <tr
                v-for="ticket in filteredTickets"
                :key="ticket.id"
                class="transition-colors hover:bg-slate-50/80 dark:hover:bg-slate-700/50"
              >
                <td class="px-6 py-4 font-mono text-xs font-semibold text-amber-600">{{ ticket.ticket_code }}</td>
                <td class="px-6 py-4">
                  <div class="flex items-center gap-2.5">
                    <span class="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-700 text-[10px] font-bold text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-600">
                      {{ (ticket.user?.name || "?")[0]?.toUpperCase() }}
                    </span>
                    <div>
                      <p class="text-xs font-semibold text-slate-900 dark:text-white">{{ ticket.user?.name || t("na") }}</p>
                      <p class="text-[11px] text-slate-400 dark:text-slate-500">{{ ticket.user?.email || '' }}</p>
                    </div>
                  </div>
                </td>
                <td class="px-6 py-4">
                  <p class="max-w-[200px] truncate text-xs font-medium text-slate-800 dark:text-slate-200">{{ ticket.ticket_type?.event?.title || t("na") }}</p>
                  <p class="text-[11px] text-slate-400 dark:text-slate-500">{{ ticket.ticket_type?.name || '' }}</p>
                </td>
                <td class="px-6 py-4 text-[11px] font-mono text-slate-500 dark:text-slate-400">{{ ticket.booking?.booking_number || `#${ticket.booking_id}` }}</td>
                <td class="px-6 py-4">
                  <span class="rounded-full border px-2.5 py-0.5 text-[11px] font-semibold capitalize" :class="statusStyle[ticket.status] || 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'">
                    {{ statusLabel(ticket.status) }}
                  </span>
                </td>
                <td class="px-6 py-4 text-xs text-slate-500 dark:text-slate-400">{{ formatDate(ticket.created_at) }}</td>
                <td class="px-6 py-4 text-right">
                  <div class="flex items-center justify-end gap-1.5">
                    <button
                      type="button"
                      @click="selectedTicket = ticket"
                      class="rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700 p-1.5 text-slate-600 dark:text-slate-400 hover:border-amber-500 hover:text-amber-700 hover:bg-amber-50"
                      :title="t('view')"
                    >
                      <Eye :size="14" />
                    </button>
                    <button
                      v-if="ticket.status === 'ACTIVE'"
                      type="button"
                      @click="cancelTicket(ticket)"
                      class="rounded-lg border border-rose-200 bg-rose-50 p-1.5 text-rose-600 hover:bg-rose-100 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-400 dark:hover:bg-red-500/20"
                      :title="t('cancel')"
                    >
                      <XCircle :size="14" />
                    </button>
                  </div>
                </td>
              </tr>
              <tr v-if="filteredTickets.length === 0">
                <td colspan="7" class="px-6 py-10 text-center text-sm text-slate-400 dark:text-slate-500">
                  {{ t("noTicketsFound") }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </template>

    <!-- Ticket Detail Modal -->
    <div
      v-if="selectedTicket"
      class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm"
    >
      <div class="w-full max-w-sm rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 shadow-2xl">
        <div class="mb-4 flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-4">
          <h3 class="text-lg font-bold text-slate-900 dark:text-white">{{ t("ticketDetails") }}</h3>
          <button @click="selectedTicket = null" class="rounded-lg p-1 text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-700 dark:hover:text-slate-200">&#x2715;</button>
        </div>
        <div class="space-y-3 text-sm">
          <p class="flex items-center gap-2">
            <Ticket :size="15" class="text-amber-600" />
            <span class="font-mono font-bold text-slate-900 dark:text-white">{{ selectedTicket.ticket_code }}</span>
          </p>
          <p class="flex items-center gap-2">
            <Users :size="15" class="text-slate-400 dark:text-slate-500" />
            <span class="text-slate-700 dark:text-slate-300">{{ selectedTicket.user?.name || t("na") }}</span>
          </p>
          <p class="flex items-center gap-2">
            <Calendar :size="15" class="text-slate-400 dark:text-slate-500" />
            <span class="text-slate-700 dark:text-slate-300">{{ selectedTicket.ticket_type?.event?.title || t("na") }} · {{ selectedTicket.ticket_type?.name || '' }}</span>
          </p>
          <p class="flex items-center gap-2">
            <Building2 :size="15" class="text-slate-400 dark:text-slate-500" />
            <span class="text-slate-700 dark:text-slate-300">{{ t("bookingLabel") }} {{ selectedTicket.booking?.booking_number || `#${selectedTicket.booking_id}` }}</span>
          </p>
          <p class="flex items-center gap-2">
            <QrCode :size="15" class="text-slate-400 dark:text-slate-500" />
            <span class="truncate font-mono text-[10px] text-slate-500 dark:text-slate-400">{{ selectedTicket.qr_token || t("noQrToken") }}</span>
          </p>
        </div>
      </div>
    </div>
  </main>
</template>
