<script setup>
import { ref, computed, onMounted } from "vue";
import { adminApi } from "@/api/admin.js";
import {
  ShoppingBag,
  Search,
  Eye,
  CheckCircle2,
  Clock,
  XCircle,
  ArrowUpRight,
  User,
  Calendar,
  CreditCard,
  X,
  Receipt,
  Ticket,
} from "lucide-vue-next";

const loading = ref(true);
const error = ref(null);

const bookings = ref([]);

async function fetchBookings() {
  loading.value = true;
  error.value = null;
  try {
    const res = await adminApi.getBookings();
    bookings.value = res.data ?? [];
  } catch (e) {
    error.value = e.response?.data?.message || e.message || "Failed to load bookings.";
  } finally {
    loading.value = false;
  }
}

onMounted(fetchBookings);

const stats = computed(() => {
  const total = bookings.value.length;
  const confirmedPaid = bookings.value.filter(
    (b) => b.payments?.[0]?.payment_status === "paid"
  ).length;
  const pending = bookings.value.filter((b) => b.status === "pending").length;
  const fulfillment = total ? Math.round((confirmedPaid / total) * 100) : 0;
  return [
    { label: "Total Bookings", value: String(total), change: "All time bookings", icon: ShoppingBag, color: "bg-orange-50 text-orange-600" },
    { label: "Confirmed & Paid", value: String(confirmedPaid), change: `${fulfillment}% fulfillment rate`, icon: CheckCircle2, color: "bg-emerald-50 text-emerald-600" },
    { label: "Pending Payment", value: String(pending), change: "Awaiting customer settlement", icon: Clock, color: "bg-amber-50 text-amber-600" },
  ];
});

const searchQuery = ref("");
const selectedStatus = ref("All");

const statusStyle = {
  confirmed: "bg-emerald-50 text-emerald-700 border-emerald-200",
  completed: "bg-sky-50 text-sky-700 border-sky-200",
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  cancelled: "bg-rose-50 text-rose-700 border-rose-200",
};

function formatDate(value) {
  if (!value) return "N/A";
  const date = new Date(value);
  if (isNaN(date.getTime())) return value;
  return date.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

const filteredBookings = computed(() => {
  return bookings.value.filter((b) => {
    const matchesSearch =
      (b.booking_number || "").toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      (b.user?.name || "").toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      (b.user?.email || "").toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      (b.event?.title || "").toLowerCase().includes(searchQuery.value.toLowerCase());

    const matchesStatus =
      selectedStatus.value === "All" || b.status === selectedStatus.value;

    return matchesSearch && matchesStatus;
  });
});

// Detail Modal
const selectedBooking = ref(null);
const isDetailOpen = ref(false);

function viewBooking(booking) {
  selectedBooking.value = booking;
  isDetailOpen.value = true;
}

function updateStatus(newStatus) {
  if (selectedBooking.value) {
    selectedBooking.value.status = newStatus;
  }
}
</script>

<template>
  <main class="min-h-screen flex-1 bg-slate-50 px-8 py-8 text-slate-800">
    <!-- Header -->
    <div class="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <div class="flex items-center gap-2.5">
          <h1 class="text-3xl font-extrabold tracking-tight text-slate-900">Bookings Management</h1>
          <span class="rounded-md bg-orange-100 border border-orange-200 px-2.5 py-0.5 text-xs text-orange-800 font-mono font-medium">
            manage_bookings
          </span>
        </div>
        <p class="mt-1 text-sm text-slate-500">Track customer orders, ticket item breakdowns, and fulfillment status.</p>
      </div>
    </div>

    <!-- Stat cards -->
    <div v-if="loading" class="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
      <div
        v-for="n in 3"
        :key="n"
        class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
      >
        <div class="mb-4 flex items-start justify-between">
          <div class="h-3 w-24 animate-pulse rounded bg-slate-100"></div>
          <div class="h-8 w-8 animate-pulse rounded-lg bg-slate-100"></div>
        </div>
        <div class="h-7 w-20 animate-pulse rounded bg-slate-100"></div>
        <div class="mt-2 h-3 w-32 animate-pulse rounded bg-slate-100"></div>
      </div>
    </div>

    <div v-else-if="error" class="mb-8 rounded-xl border border-rose-200 bg-rose-50 p-6 text-center">
      <p class="text-sm font-semibold text-rose-700">{{ error }}</p>
    </div>

    <div v-else class="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
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

    <!-- Filter & Search -->
    <div class="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div class="relative min-w-[260px] flex-1">
        <Search :size="16" class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Search bookings by number, customer, event..."
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
          <option value="confirmed">Confirmed</option>
          <option value="completed">Completed</option>
          <option value="pending">Pending</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>
    </div>

    <!-- Bookings Table -->
    <div class="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div class="flex items-center justify-between border-b border-slate-200 px-6 py-4">
        <h2 class="text-base font-bold text-slate-900">Customer Bookings ({{ filteredBookings.length }})</h2>
      </div>

      <div v-if="loading" class="overflow-x-auto">
        <table class="w-full text-left text-sm">
          <thead class="bg-slate-50/70 border-b border-slate-200">
            <tr class="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              <th class="px-6 py-3">Booking #</th>
              <th class="px-6 py-3">Customer</th>
              <th class="px-6 py-3">Event & Venue</th>
              <th class="px-6 py-3">Date Booked</th>
              <th class="px-6 py-3">Total Amount</th>
              <th class="px-6 py-3">Status</th>
              <th class="px-6 py-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="n in 4" :key="n">
              <td class="px-6 py-4"><div class="h-3 w-24 animate-pulse rounded bg-slate-100"></div></td>
              <td class="px-6 py-4">
                <div class="h-3 w-32 animate-pulse rounded bg-slate-100"></div>
                <div class="mt-2 h-3 w-24 animate-pulse rounded bg-slate-100"></div>
              </td>
              <td class="px-6 py-4">
                <div class="h-3 w-40 animate-pulse rounded bg-slate-100"></div>
                <div class="mt-2 h-3 w-28 animate-pulse rounded bg-slate-100"></div>
              </td>
              <td class="px-6 py-4"><div class="h-3 w-32 animate-pulse rounded bg-slate-100"></div></td>
              <td class="px-6 py-4"><div class="h-3 w-16 animate-pulse rounded bg-slate-100"></div></td>
              <td class="px-6 py-4"><div class="h-5 w-20 animate-pulse rounded-full bg-slate-100"></div></td>
              <td class="px-6 py-4"><div class="ml-auto h-8 w-24 animate-pulse rounded-lg bg-slate-100"></div></td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-else-if="error" class="px-6 py-16 text-center">
        <p class="text-sm font-semibold text-rose-700">{{ error }}</p>
      </div>

      <div v-else-if="bookings.length === 0" class="px-6 py-16 text-center">
        <div class="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
          <ShoppingBag :size="22" />
        </div>
        <p class="text-sm font-semibold text-slate-700">No bookings yet</p>
        <p class="mt-1 text-xs text-slate-400">Customer bookings will appear here once placed.</p>
      </div>

      <div v-else class="overflow-x-auto">
        <table class="w-full text-left text-sm">
          <thead class="bg-slate-50/70 border-b border-slate-200">
            <tr class="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              <th class="px-6 py-3">Booking #</th>
              <th class="px-6 py-3">Customer</th>
              <th class="px-6 py-3">Event & Venue</th>
              <th class="px-6 py-3">Date Booked</th>
              <th class="px-6 py-3">Total Amount</th>
              <th class="px-6 py-3">Status</th>
              <th class="px-6 py-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr
              v-for="b in filteredBookings"
              :key="b.id"
              class="transition-colors hover:bg-slate-50/80"
            >
              <td class="px-6 py-4 font-mono text-xs text-amber-600 font-bold">
                {{ b.booking_number }}
              </td>
              <td class="px-6 py-4">
                <p class="font-semibold text-slate-900">{{ b.user?.name }}</p>
                <p class="text-xs text-slate-400">{{ b.user?.email }}</p>
              </td>
              <td class="px-6 py-4">
                <p class="font-medium text-slate-800 truncate max-w-xs">{{ b.event?.title }}</p>
                <p class="text-xs text-slate-400">{{ b.event?.venue?.name || 'N/A' }}</p>
              </td>
              <td class="px-6 py-4 text-xs text-slate-600">
                {{ formatDate(b.booking_date) }}
              </td>
              <td class="px-6 py-4 font-mono text-sm font-bold text-slate-900">
                ${{ Number(b.total_amount).toFixed(2) }}
              </td>
              <td class="px-6 py-4">
                <span class="rounded-full border px-2.5 py-0.5 text-[11px] font-semibold capitalize" :class="statusStyle[b.status] || 'bg-slate-50 text-slate-600 border-slate-200'">
                  {{ b.status }}
                </span>
              </td>
              <td class="px-6 py-4 text-right">
                <button
                  type="button"
                  @click="viewBooking(b)"
                  class="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:border-amber-500 hover:text-amber-700 hover:bg-amber-50"
                >
                  <Eye :size="13" />
                  View Slip
                </button>
              </td>
            </tr>
            <tr v-if="filteredBookings.length === 0">
              <td colspan="7" class="px-6 py-8 text-center text-sm text-slate-400">
                No bookings found matching search criteria.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Booking Details Modal -->
    <div
      v-if="isDetailOpen && selectedBooking"
      class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm"
    >
      <div class="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
        <div class="mb-5 flex items-center justify-between border-b border-slate-200 pb-4">
          <div class="flex items-center gap-3">
            <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600 border border-amber-200">
              <Receipt :size="20" />
            </div>
            <div>
              <h3 class="text-lg font-bold text-slate-900">Booking Details: {{ selectedBooking.booking_number }}</h3>
              <p class="text-xs text-slate-400">Booked on {{ formatDate(selectedBooking.booking_date) }}</p>
            </div>
          </div>
          <button @click="isDetailOpen = false" class="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700">
            <X :size="18" />
          </button>
        </div>

        <div class="space-y-5">
          <!-- Customer & Event Grid -->
          <div class="grid grid-cols-2 gap-4 rounded-xl bg-slate-50 p-4 border border-slate-200">
            <div>
              <p class="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">Customer Information</p>
              <p class="text-sm font-bold text-slate-900">{{ selectedBooking.user?.name }}</p>
              <p class="text-xs text-slate-600">{{ selectedBooking.user?.email }}</p>
              <p class="text-xs text-slate-400">{{ selectedBooking.user?.phone || 'N/A' }}</p>
            </div>
            <div>
              <p class="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">Event Information</p>
              <p class="text-sm font-bold text-slate-900">{{ selectedBooking.event?.title }}</p>
              <p class="text-xs text-slate-600">{{ selectedBooking.event?.venue?.name || 'N/A' }}</p>
              <p class="text-xs text-amber-600 font-semibold">{{ selectedBooking.event?.start_date || 'N/A' }}</p>
            </div>
          </div>

          <!-- Items Table -->
          <div>
            <p class="text-xs font-bold text-slate-700 mb-2">Ordered Ticket Items</p>
            <div class="overflow-hidden rounded-lg border border-slate-200 bg-white">
              <table class="w-full text-left text-xs">
                <thead class="bg-slate-50 text-slate-500 font-semibold">
                  <tr>
                    <th class="px-4 py-2.5">Ticket Tier</th>
                    <th class="px-4 py-2.5">Unit Price</th>
                    <th class="px-4 py-2.5">Qty</th>
                    <th class="px-4 py-2.5 text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100">
                  <tr v-for="item in selectedBooking.items || []" :key="item.id">
                    <td class="px-4 py-2.5 font-semibold text-slate-900">{{ item.ticketType?.name || 'Ticket' }}</td>
                    <td class="px-4 py-2.5 text-slate-600">${{ Number(item.unit_price).toFixed(2) }}</td>
                    <td class="px-4 py-2.5 text-slate-600">{{ item.quantity }}</td>
                    <td class="px-4 py-2.5 text-right font-bold text-slate-900">${{ Number(item.subtotal).toFixed(2) }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- Total & Status -->
          <div class="flex items-center justify-between border-t border-slate-200 pt-4">
            <div>
              <p class="text-xs font-semibold text-slate-500">Booking Status:</p>
              <div class="mt-1 flex items-center gap-2">
                <select
                  v-model="selectedBooking.status"
                  class="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-800 outline-none focus:bg-white focus:border-amber-500 capitalize"
                >
                  <option value="confirmed">Confirmed</option>
                  <option value="completed">Completed</option>
                  <option value="pending">Pending</option>
                  <option value="cancelled">Cancelled</option>
                </select>
                <span
                  v-if="selectedBooking.payments?.[0]?.payment_status"
                  class="rounded-full border px-2.5 py-0.5 text-[11px] font-semibold capitalize"
                  :class="selectedBooking.payments?.[0]?.payment_status === 'paid' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'"
                >
                  {{ selectedBooking.payments?.[0]?.payment_status }}
                </span>
              </div>
            </div>

            <div class="text-right">
              <p class="text-xs text-slate-500">Total Amount Charged</p>
              <p class="text-2xl font-bold text-amber-600 font-mono">${{ Number(selectedBooking.total_amount).toFixed(2) }}</p>
            </div>
          </div>
        </div>

        <div class="mt-6 flex justify-end">
          <button
            type="button"
            @click="isDetailOpen = false"
            class="rounded-lg bg-amber-500 px-5 py-2 text-xs font-semibold text-slate-950 shadow-sm transition-all hover:bg-amber-600"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  </main>
</template>
