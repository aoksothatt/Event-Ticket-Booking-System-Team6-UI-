<script setup>
import { ref, computed } from "vue";
import { useRouter } from "vue-router";
import { Search, DollarSign, CalendarCheck, UserPlus, ArrowUpRight, ArrowDownRight } from "lucide-vue-next";

const router = useRouter();

const stats = [
  {
    label: "Total Revenue",
    value: "$1.24M",
    change: "+14.5% from last month",
    trend: "up",
    icon: DollarSign,
  },
  {
    label: "Active Events",
    value: "342",
    change: "+22 this week",
    trend: "up",
    icon: CalendarCheck,
  },
  {
    label: "New Users",
    value: "8,901",
    change: "-2.1% from last month",
    trend: "down",
    icon: UserPlus,
  },
];

const searchQuery = ref("");

const orders = ref([
  {
    id: "#ORD-9921",
    customer: "Sarah Jenkins",
    initials: "SJ",
    event: "Neon Nights Festival",
    date: "Oct 24, 2024",
    amount: "$250.00",
  },
  {
    id: "#ORD-9920",
    customer: "Marcus Reed",
    initials: "MR",
    event: "Symphony in the Park",
    date: "Oct 24, 2024",
    amount: "$85.00",
  },
  {
    id: "#ORD-9919",
    customer: "Elena Rodriguez",
    initials: "ER",
    event: "Tech Summit 2024 (VIP)",
    date: "Oct 23, 2024",
    amount: "$1,200.00",
    highlight: true,
  },
  {
    id: "#ORD-9918",
    customer: "Thomas Chen",
    initials: "TC",
    event: "Underground Comedy Club",
    date: "Oct 23, 2024",
    amount: "$45.00",
  },
]);

const filteredOrders = computed(() => {
  return orders.value.filter((order) => {
    return (
      order.customer.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      order.event.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      order.id.toLowerCase().includes(searchQuery.value.toLowerCase())
    );
  });
});

function goToTickets() {
  router.push("/admin/tickets");
}
</script>

<template>
  <main class="min-h-screen flex-1 bg-[#0B0B0C] px-8 py-8 text-white">
    <!-- Header -->
    <div class="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h1 class="text-3xl font-bold tracking-tight">Dashboard Overview</h1>
        <p class="mt-1 text-sm text-white/50">Real-time platform metrics and recent transactions.</p>
      </div>
      <div class="relative">
        <Search :size="16" class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Search orders..."
          class="w-64 rounded-lg border border-white/10 bg-[#111113] py-2.5 pl-9 pr-3 text-sm text-white placeholder:text-white/40 outline-none focus:border-amber-500/60"
        />
      </div>
    </div>

    <!-- Stat cards -->
    <div class="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
      <div
        v-for="stat in stats"
        :key="stat.label"
        class="rounded-xl border border-white/10 bg-[#141416] p-5"
      >
        <div class="mb-6 flex items-start justify-between">
          <p class="text-xs font-medium text-white/50">{{ stat.label }}</p>
          <span class="flex h-8 w-8 items-center justify-center rounded-md bg-white/5 text-amber-400">
            <component :is="stat.icon" :size="16" :stroke-width="2" />
          </span>
        </div>
        <p class="text-2xl font-bold">{{ stat.value }}</p>
        <p
          class="mt-2 flex items-center gap-1 text-xs"
          :class="stat.trend === 'up' ? 'text-emerald-400' : 'text-rose-400'"
        >
          <component :is="stat.trend === 'up' ? ArrowUpRight : ArrowDownRight" :size="14" :stroke-width="2.5" />
          {{ stat.change }}
        </p>
      </div>
    </div>

    <!-- Recent orders -->
    <div class="overflow-hidden rounded-xl border border-white/10 bg-[#141416]">
      <div class="flex items-center justify-between border-b border-white/10 px-5 py-4">
        <h2 class="text-base font-semibold">Recent Ticket Sales</h2>
        <button
          type="button"
          @click="goToTickets"
          class="text-xs font-medium text-amber-400 hover:text-amber-300 transition-colors"
        >
          View All Tickets
        </button>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full text-left text-sm">
          <thead>
            <tr class="text-xs text-white/40">
              <th class="px-5 py-3 font-medium">Order ID</th>
              <th class="px-5 py-3 font-medium">Customer</th>
              <th class="px-5 py-3 font-medium">Event</th>
              <th class="px-5 py-3 font-medium">Date</th>
              <th class="px-5 py-3 text-right font-medium">Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="order in filteredOrders"
              :key="order.id"
              class="border-t border-white/5 transition-colors hover:bg-white/[0.03]"
            >
              <td class="px-5 py-4 font-mono text-xs text-white/50">{{ order.id }}</td>
              <td class="px-5 py-4">
                <div class="flex items-center gap-2">
                  <span class="flex h-7 w-7 items-center justify-center rounded-full bg-white/10 text-[11px] font-medium text-white/70">
                    {{ order.initials }}
                  </span>
                  <span class="text-white">{{ order.customer }}</span>
                </div>
              </td>
              <td class="px-5 py-4 text-white/70">{{ order.event }}</td>
              <td class="px-5 py-4 text-white/50">{{ order.date }}</td>
              <td
                class="px-5 py-4 text-right font-medium"
                :class="order.highlight ? 'text-amber-400' : 'text-white'"
              >
                {{ order.amount }}
              </td>
            </tr>
            <tr v-if="filteredOrders.length === 0">
              <td colspan="5" class="px-5 py-8 text-center text-sm text-white/40">
                No orders found matching your search.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </main>
</template>
