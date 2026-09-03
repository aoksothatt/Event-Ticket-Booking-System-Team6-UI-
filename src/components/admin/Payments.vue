<script setup>
import { ref, computed } from "vue";
import {
  CreditCard,
  Search,
  CheckCircle2,
  Clock,
  XCircle,
  RefreshCw,
  ArrowUpRight,
  DollarSign,
  Eye,
  X,
  Receipt,
  FileCheck,
} from "lucide-vue-next";

const stats = [
  { label: "Total Volume Settled", value: "$1,248,500", change: "+14.5% vs last month", icon: DollarSign, color: "bg-emerald-50 text-emerald-600" },
  { label: "Successful Transactions", value: "6,192", change: "98.2% transaction success", icon: CheckCircle2, color: "bg-blue-50 text-blue-600" },
  { label: "Pending Settlements", value: "$3,420", change: "18 transactions in escrow", icon: Clock, color: "bg-amber-50 text-amber-600" },
];

const searchQuery = ref("");
const selectedStatus = ref("All");
const selectedMethod = ref("All");

const payments = ref([
  {
    id: 1,
    transaction_id: "TXN-994182901",
    booking_number: "BK-984210",
    customer: "Sarah Jenkins",
    email: "sarah.j@example.com",
    event: "Neon Nights Music Festival",
    payment_method: "ABA Pay (KHQR)",
    amount: 250.00,
    currency: "USD",
    payment_status: "paid",
    paid_at: "Oct 24, 2024 • 02:45 PM",
  },
  {
    id: 2,
    transaction_id: "TXN-994182902",
    booking_number: "BK-984209",
    customer: "Marcus Reed",
    email: "m.reed@urbanbeats.org",
    event: "Symphony in the Park 2024",
    payment_method: "Credit Card (Visa)",
    amount: 85.00,
    currency: "USD",
    payment_status: "paid",
    paid_at: "Oct 24, 2024 • 01:20 PM",
  },
  {
    id: 3,
    transaction_id: "TXN-994182903",
    booking_number: "BK-984208",
    customer: "Elena Rodriguez",
    email: "elena.r@techventures.io",
    event: "Global Tech Summit 2024",
    payment_method: "Credit Card (Mastercard)",
    amount: 1200.00,
    currency: "USD",
    payment_status: "paid",
    paid_at: "Oct 23, 2024 • 06:10 PM",
  },
  {
    id: 4,
    transaction_id: "TXN-994182904",
    booking_number: "BK-984207",
    customer: "Thomas Chen",
    email: "thomas.c@cloudmail.com",
    event: "Underground Comedy Night",
    payment_method: "PayPal",
    amount: 90.00,
    currency: "USD",
    payment_status: "pending",
    paid_at: "Pending confirmation",
  },
  {
    id: 5,
    transaction_id: "TXN-994182905",
    booking_number: "BK-984206",
    customer: "Priya Nair",
    email: "priya.nair@webmail.org",
    event: "Modern Art Gala",
    payment_method: "ABA Pay (KHQR)",
    amount: 150.00,
    currency: "USD",
    payment_status: "paid",
    paid_at: "Oct 22, 2024 • 11:15 AM",
  },
  {
    id: 6,
    transaction_id: "TXN-994182906",
    booking_number: "BK-984205",
    customer: "Diego Alvarez",
    email: "diego.a@visuals.org",
    event: "Neon Nights Music Festival",
    payment_method: "Credit Card (Visa)",
    amount: 85.00,
    currency: "USD",
    payment_status: "refunded",
    paid_at: "Refunded on Oct 22, 2024",
  },
]);

const methods = ["All", "Credit Card", "ABA Pay", "PayPal"];
const statuses = ["All", "paid", "pending", "refunded", "failed"];

const statusStyle = {
  paid: "bg-emerald-50 text-emerald-700 border-emerald-200",
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  refunded: "bg-purple-50 text-purple-700 border-purple-200",
  failed: "bg-rose-50 text-rose-700 border-rose-200",
};

const filteredPayments = computed(() => {
  return payments.value.filter((p) => {
    const matchesSearch =
      p.transaction_id.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      p.booking_number.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      p.payment_method.toLowerCase().includes(searchQuery.value.toLowerCase());

    const matchesStatus =
      selectedStatus.value === "All" || p.payment_status === selectedStatus.value;

    const matchesMethod =
      selectedMethod.value === "All" || p.payment_method.includes(selectedMethod.value);

    return matchesSearch && matchesStatus && matchesMethod;
  });
});

// Modal state
const selectedPayment = ref(null);
const isModalOpen = ref(false);

function viewPayment(payment) {
  selectedPayment.value = payment;
  isModalOpen.value = true;
}
</script>

<template>
  <main class="min-h-screen flex-1 bg-slate-50 px-8 py-8 text-slate-800">
    <!-- Header -->
    <div class="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <div class="flex items-center gap-2.5">
          <h1 class="text-3xl font-extrabold tracking-tight text-slate-900">Payments & Transactions</h1>
          <span class="rounded-md bg-emerald-100 border border-emerald-200 px-2.5 py-0.5 text-xs text-emerald-800 font-mono font-medium">
            manage_payments
          </span>
        </div>
        <p class="mt-1 text-sm text-slate-500">Monitor transaction gateways, payment settlements, and customer refunds.</p>
      </div>
    </div>

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
          placeholder="Search by transaction ID, booking #, customer..."
          class="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm text-slate-800 placeholder:text-slate-400 outline-none shadow-sm transition-all focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
        />
      </div>

      <div class="flex flex-wrap items-center gap-3">
        <div class="flex items-center gap-2">
          <label class="text-xs font-semibold text-slate-500">Method:</label>
          <select
            v-model="selectedMethod"
            class="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 outline-none shadow-sm focus:border-amber-500"
          >
            <option v-for="m in methods" :key="m" :value="m">{{ m }}</option>
          </select>
        </div>

        <div class="flex items-center gap-2">
          <label class="text-xs font-semibold text-slate-500">Status:</label>
          <select
            v-model="selectedStatus"
            class="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 outline-none shadow-sm focus:border-amber-500 capitalize"
          >
            <option v-for="s in statuses" :key="s" :value="s">{{ s }}</option>
          </select>
        </div>
      </div>
    </div>

    <!-- Payments Table -->
    <div class="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div class="flex items-center justify-between border-b border-slate-200 px-6 py-4">
        <h2 class="text-base font-bold text-slate-900">Payment Records ({{ filteredPayments.length }})</h2>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full text-left text-sm">
          <thead class="bg-slate-50/70 border-b border-slate-200">
            <tr class="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              <th class="px-6 py-3">Transaction ID</th>
              <th class="px-6 py-3">Booking #</th>
              <th class="px-6 py-3">Payment Gateway</th>
              <th class="px-6 py-3">Amount</th>
              <th class="px-6 py-3">Status</th>
              <th class="px-6 py-3">Settled At</th>
              <th class="px-6 py-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr
              v-for="p in filteredPayments"
              :key="p.id"
              class="transition-colors hover:bg-slate-50/80"
            >
              <td class="px-6 py-4 font-mono text-xs font-bold text-amber-600">
                {{ p.transaction_id }}
              </td>
              <td class="px-6 py-4 font-mono text-xs text-slate-600">
                {{ p.booking_number }}
              </td>
              <td class="px-6 py-4 text-xs font-medium text-slate-700">
                <span class="rounded-md bg-slate-100 border border-slate-200 px-2.5 py-1 text-xs text-slate-800">
                  {{ p.payment_method }}
                </span>
              </td>
              <td class="px-6 py-4 font-mono font-bold text-slate-900">
                ${{ p.amount.toFixed(2) }} <span class="text-[10px] font-normal text-slate-400">{{ p.currency }}</span>
              </td>
              <td class="px-6 py-4">
                <span class="rounded-full border px-2.5 py-0.5 text-[11px] font-semibold capitalize" :class="statusStyle[p.payment_status]">
                  {{ p.payment_status }}
                </span>
              </td>
              <td class="px-6 py-4 text-xs text-slate-500">
                {{ p.paid_at }}
              </td>
              <td class="px-6 py-4 text-right">
                <button
                  type="button"
                  @click="viewPayment(p)"
                  class="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-700 hover:border-amber-500 hover:text-amber-700 hover:bg-amber-50"
                >
                  <Eye :size="13" />
                  Receipt
                </button>
              </td>
            </tr>
            <tr v-if="filteredPayments.length === 0">
              <td colspan="7" class="px-6 py-8 text-center text-sm text-slate-400">
                No payment transactions found.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Receipt Modal -->
    <div
      v-if="isModalOpen && selectedPayment"
      class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm"
    >
      <div class="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
        <div class="mb-5 flex items-center justify-between border-b border-slate-200 pb-4">
          <div class="flex items-center gap-2.5">
            <FileCheck :size="20" class="text-emerald-600" />
            <h3 class="text-base font-bold text-slate-900">Payment Transaction Receipt</h3>
          </div>
          <button @click="isModalOpen = false" class="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700">
            <X :size="18" />
          </button>
        </div>

        <div class="space-y-3.5 text-xs">
          <div class="flex justify-between py-1 border-b border-slate-100">
            <span class="text-slate-500">Transaction ID</span>
            <span class="font-mono text-amber-600 font-bold">{{ selectedPayment.transaction_id }}</span>
          </div>
          <div class="flex justify-between py-1 border-b border-slate-100">
            <span class="text-slate-500">Booking Reference</span>
            <span class="font-mono text-slate-800 font-semibold">{{ selectedPayment.booking_number }}</span>
          </div>
          <div class="flex justify-between py-1 border-b border-slate-100">
            <span class="text-slate-500">Payment Gateway</span>
            <span class="text-slate-800 font-medium">{{ selectedPayment.payment_method }}</span>
          </div>
          <div class="flex justify-between py-1 border-b border-slate-100">
            <span class="text-slate-500">Status</span>
            <span class="rounded-full px-2 py-0.5 font-semibold capitalize" :class="statusStyle[selectedPayment.payment_status]">
              {{ selectedPayment.payment_status }}
            </span>
          </div>
          <div class="flex justify-between py-1 border-b border-slate-100">
            <span class="text-slate-500">Settlement Date</span>
            <span class="text-slate-700">{{ selectedPayment.paid_at }}</span>
          </div>
          <div class="flex justify-between pt-2 text-sm font-bold">
            <span class="text-slate-900">Total Amount</span>
            <span class="text-amber-600 font-mono text-base">${{ selectedPayment.amount.toFixed(2) }} {{ selectedPayment.currency }}</span>
          </div>
        </div>

        <div class="mt-6 flex justify-end">
          <button
            type="button"
            @click="isModalOpen = false"
            class="rounded-lg bg-amber-500 px-5 py-2 text-xs font-semibold text-slate-950 shadow-sm transition-all hover:bg-amber-600"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  </main>
</template>
