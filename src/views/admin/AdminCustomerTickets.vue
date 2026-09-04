<script setup>
import { ref, computed, onMounted } from "vue";
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

const loading = ref(true);
const error = ref(null);
const tickets = ref([]);

const searchQuery = ref("");
const selectedStatus = ref("All");
const verifyToken = ref("");
const verifyResult = ref(null);
const verifying = ref(false);
const selectedTicket = ref(null);

const statuses = ["All", "active", "used", "cancelled", "expired"];

const statusStyle = {
  active: "bg-emerald-50 text-emerald-700 border-emerald-200",
  used: "bg-sky-50 text-sky-700 border-sky-200",
  cancelled: "bg-rose-50 text-rose-700 border-rose-200",
  expired: "bg-amber-50 text-amber-700 border-amber-200",
};

const stats = computed(() => {
  const total = tickets.value.length;
  const active = tickets.value.filter((t) => t.status === "active").length;
  const used = tickets.value.filter((t) => t.status === "used").length;
  return [
    { label: "Total Tickets", value: String(total), change: "issued to customers", icon: Ticket, color: "bg-purple-50 text-purple-600" },
    { label: "Active", value: String(active), change: "not yet scanned", icon: QrCode, color: "bg-emerald-50 text-emerald-600" },
    { label: "Checked In", value: String(used), change: "scanned & used", icon: Users, color: "bg-sky-50 text-sky-600" },
  ];
});

function formatDate(d) {
  if (!d) return "TBD";
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
    error.value = e.response?.data?.message || e.message || "Failed to load tickets.";
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
  try {
    verifyResult.value = await adminApi.verifyTicket(qrToken.trim());
  } catch (e) {
    verifyResult.value = {
      success: false,
      message: e.response?.data?.message || e.message || "Could not verify ticket.",
    };
  } finally {
    verifying.value = false;
    await fetchTickets();
  }
}

async function cancelTicket(t) {
  if (!confirm(`Cancel ticket ${t.ticket_code}?`)) return;
  try {
    await adminApi.cancelTicket(t.id);
    await fetchTickets();
  } catch (e) {
    alert(e.response?.data?.message || e.message || "Failed to cancel ticket.");
  }
}
</script>

<template>
  <main class="min-h-screen flex-1 bg-slate-50 px-8 py-8 text-slate-800">
    <!-- Header -->
    <div class="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <div class="flex items-center gap-2.5">
          <h1 class="text-3xl font-extrabold tracking-tight text-slate-900">Customer Tickets</h1>
          <span class="rounded-md bg-amber-100 border border-amber-200 px-2.5 py-0.5 text-xs text-amber-800 font-mono font-medium">
            manage_tickets
          </span>
        </div>
        <p class="mt-1 text-sm text-slate-500">
          Actual admission tickets issued to customers after payment. Each seat has its own code.
        </p>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
      <div v-for="n in 3" :key="n" class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm animate-pulse">
        <div class="h-3 w-24 rounded bg-slate-200 mb-4"></div>
        <div class="h-7 w-16 rounded bg-slate-200 mb-2"></div>
        <div class="h-3 w-32 rounded bg-slate-100"></div>
      </div>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="mb-8 rounded-xl border border-rose-200 bg-rose-50 p-6 text-center">
      <p class="text-sm font-semibold text-rose-700">{{ error }}</p>
      <button @click="fetchTickets" class="mt-3 text-xs font-semibold text-rose-600 underline hover:text-rose-800">Retry</button>
    </div>

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

      <!-- Verify Panel -->
      <div class="mb-6 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div class="flex flex-wrap items-center gap-3">
          <div class="w-full">
            <label class="mb-1 block text-xs font-semibold text-slate-700">Verify / Check-In by QR Token</label>
            <div class="flex gap-2">
              <input
                v-model="verifyToken"
                type="text"
                placeholder="Paste QR token or ticket code..."
                class="w-full rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2 text-sm text-slate-900 outline-none focus:bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
              />
              <button
                type="button"
                :disabled="verifying || !verifyToken.trim()"
                @click="verifyTicket(verifyToken)"
                class="flex items-center gap-2 rounded-lg bg-amber-500 px-4 py-2 text-xs font-semibold text-slate-950 shadow-sm hover:bg-amber-600 disabled:opacity-50"
              >
                <Loader2 v-if="verifying" :size="14" class="animate-spin" />
                <QrCode v-else :size="14" />
                Verify
              </button>
            </div>
          </div>
        </div>
        <div v-if="verifyResult" class="mt-3 rounded-lg border px-3 py-2 text-xs font-medium"
             :class="verifyResult.success ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-rose-200 bg-rose-50 text-rose-700'">
          {{ verifyResult.message }}
        </div>
      </div>

      <!-- Filter & Search -->
      <div class="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div class="relative min-w-[260px] flex-1">
          <Search :size="16" class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search by code, customer, event..."
            class="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm text-slate-800 placeholder:text-slate-400 outline-none shadow-sm transition-all focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
          />
        </div>
        <select
          v-model="selectedStatus"
          class="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 outline-none shadow-sm focus:border-amber-500"
        >
          <option v-for="st in statuses" :key="st" :value="st">{{ st }}</option>
        </select>
      </div>

      <!-- Tickets Table -->
      <div class="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div class="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <h2 class="text-base font-bold text-slate-900">Issued Tickets ({{ filteredTickets.length }})</h2>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full text-left text-sm">
            <thead class="bg-slate-50/70 border-b border-slate-200">
              <tr class="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th class="px-6 py-3">Ticket Code</th>
                <th class="px-6 py-3">Customer</th>
                <th class="px-6 py-3">Event / Type</th>
                <th class="px-6 py-3">Booking</th>
                <th class="px-6 py-3">Status</th>
                <th class="px-6 py-3">Issued</th>
                <th class="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <tr
                v-for="t in filteredTickets"
                :key="t.id"
                class="transition-colors hover:bg-slate-50/80"
              >
                <td class="px-6 py-4 font-mono text-xs font-semibold text-amber-600">{{ t.ticket_code }}</td>
                <td class="px-6 py-4">
                  <div class="flex items-center gap-2.5">
                    <span class="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-[10px] font-bold text-slate-700 border border-slate-200">
                      {{ (t.user?.name || "?")[0]?.toUpperCase() }}
                    </span>
                    <div>
                      <p class="text-xs font-semibold text-slate-900">{{ t.user?.name || 'N/A' }}</p>
                      <p class="text-[11px] text-slate-400">{{ t.user?.email || '' }}</p>
                    </div>
                  </div>
                </td>
                <td class="px-6 py-4">
                  <p class="max-w-[200px] truncate text-xs font-medium text-slate-800">{{ t.ticket_type?.event?.title || 'N/A' }}</p>
                  <p class="text-[11px] text-slate-400">{{ t.ticket_type?.name || '' }}</p>
                </td>
                <td class="px-6 py-4 text-[11px] font-mono text-slate-500">{{ t.booking?.booking_number || `#${t.booking_id}` }}</td>
                <td class="px-6 py-4">
                  <span class="rounded-full border px-2.5 py-0.5 text-[11px] font-semibold capitalize" :class="statusStyle[t.status] || 'bg-slate-100 text-slate-700 border-slate-200'">
                    {{ t.status }}
                  </span>
                </td>
                <td class="px-6 py-4 text-xs text-slate-500">{{ formatDate(t.created_at) }}</td>
                <td class="px-6 py-4 text-right">
                  <div class="flex items-center justify-end gap-1.5">
                    <button
                      type="button"
                      @click="selectedTicket = t"
                      class="rounded-lg border border-slate-200 bg-slate-50 p-1.5 text-slate-600 hover:border-amber-500 hover:text-amber-700 hover:bg-amber-50"
                      title="View"
                    >
                      <Eye :size="14" />
                    </button>
                    <button
                      v-if="t.status === 'active'"
                      type="button"
                      @click="cancelTicket(t)"
                      class="rounded-lg border border-rose-200 bg-rose-50 p-1.5 text-rose-600 hover:bg-rose-100"
                      title="Cancel"
                    >
                      <XCircle :size="14" />
                    </button>
                  </div>
                </td>
              </tr>
              <tr v-if="filteredTickets.length === 0">
                <td colspan="7" class="px-6 py-10 text-center text-sm text-slate-400">
                  No tickets found. Tickets are generated once a booking is paid.
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
      <div class="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
        <div class="mb-4 flex items-center justify-between border-b border-slate-200 pb-4">
          <h3 class="text-lg font-bold text-slate-900">Ticket Details</h3>
          <button @click="selectedTicket = null" class="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700">✕</button>
        </div>
        <div class="space-y-3 text-sm">
          <p class="flex items-center gap-2">
            <Ticket :size="15" class="text-amber-600" />
            <span class="font-mono font-bold text-slate-900">{{ selectedTicket.ticket_code }}</span>
          </p>
          <p class="flex items-center gap-2">
            <Users :size="15" class="text-slate-400" />
            <span class="text-slate-700">{{ selectedTicket.user?.name || 'N/A' }}</span>
          </p>
          <p class="flex items-center gap-2">
            <Calendar :size="15" class="text-slate-400" />
            <span class="text-slate-700">{{ selectedTicket.ticket_type?.event?.title || 'N/A' }} · {{ selectedTicket.ticket_type?.name || '' }}</span>
          </p>
          <p class="flex items-center gap-2">
            <Building2 :size="15" class="text-slate-400" />
            <span class="text-slate-700">Booking {{ selectedTicket.booking?.booking_number || `#${selectedTicket.booking_id}` }}</span>
          </p>
          <p class="flex items-center gap-2">
            <QrCode :size="15" class="text-slate-400" />
            <span class="truncate font-mono text-[10px] text-slate-500">{{ selectedTicket.qr_token || 'No QR token' }}</span>
          </p>
        </div>
      </div>
    </div>
  </main>
</template>