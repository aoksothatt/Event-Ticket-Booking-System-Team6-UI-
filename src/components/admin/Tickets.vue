<script setup>
import { ref, computed } from "vue";
import { Search, Ticket, CheckCircle2, XCircle, Clock, ArrowUpRight } from "lucide-vue-next";

const stats = [
  { label: "Tickets Sold Today", value: "1,204", change: "+18.4% vs yesterday", icon: Ticket },
  { label: "Checked In", value: "9,842", change: "68% of sold tickets", icon: CheckCircle2 },
  { label: "Refund Requests", value: "12", change: "3 pending review", icon: Clock },
];

const searchQuery = ref("");
const selectedStatus = ref("All");

const tickets = ref([
  { id: "#TCK-55231", event: "Neon Nights Festival", buyer: "Sarah Jenkins", tier: "General Admission", price: "$85.00", status: "Valid" },
  { id: "#TCK-55230", event: "Symphony in the Park", buyer: "Marcus Reed", tier: "Standard", price: "$85.00", status: "Checked In" },
  { id: "#TCK-55229", event: "Tech Summit 2024", buyer: "Elena Rodriguez", tier: "VIP", price: "$1,200.00", status: "Valid" },
  { id: "#TCK-55228", event: "Underground Comedy Club", buyer: "Thomas Chen", tier: "Standard", price: "$45.00", status: "Refunded" },
  { id: "#TCK-55227", event: "Neon Nights Festival", buyer: "Priya Nair", tier: "VIP", price: "$220.00", status: "Checked In" },
  { id: "#TCK-55226", event: "Modern Art Gala", buyer: "Diego Alvarez", tier: "General Admission", price: "$150.00", status: "Cancelled" },
]);

const statusStyle = {
  Valid: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  "Checked In": "bg-sky-500/10 text-sky-400 border-sky-500/20",
  Refunded: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  Cancelled: "bg-rose-500/10 text-rose-400 border-rose-500/20",
};

const statuses = ["All", "Valid", "Checked In", "Refunded", "Cancelled"];

const filteredTickets = computed(() => {
  return tickets.value.filter((t) => {
    const matchesSearch =
      t.id.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      t.event.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      t.buyer.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      t.tier.toLowerCase().includes(searchQuery.value.toLowerCase());

    const matchesStatus =
      selectedStatus.value === "All" || t.status === selectedStatus.value;

    return matchesSearch && matchesStatus;
  });
});
</script>

<template>
  <main class="min-h-screen flex-1 bg-[#0B0B0C] px-8 py-8 text-white">
    <!-- Header -->
    <div class="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h1 class="text-3xl font-bold tracking-tight">Tickets</h1>
        <p class="mt-1 text-sm text-white/50">Real-time status of issued, checked-in, and refunded tickets.</p>
      </div>
    </div>

    <!-- Stat cards -->
    <div class="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
      <div v-for="stat in stats" :key="stat.label" class="rounded-xl border border-white/10 bg-[#141416] p-5">
        <div class="mb-6 flex items-start justify-between">
          <p class="text-xs font-medium text-white/50">{{ stat.label }}</p>
          <span class="flex h-8 w-8 items-center justify-center rounded-md bg-white/5 text-amber-400">
            <component :is="stat.icon" :size="16" />
          </span>
        </div>
        <p class="text-2xl font-bold">{{ stat.value }}</p>
        <p class="mt-2 flex items-center gap-1 text-xs text-emerald-400">
          <ArrowUpRight :size="14" :stroke-width="2.5" />
          {{ stat.change }}
        </p>
      </div>
    </div>

    <!-- Filter & Search Bar -->
    <div class="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-white/10 bg-[#141416] p-4">
      <div class="relative min-w-[260px] flex-1">
        <Search :size="16" class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Search tickets by ID, buyer, or event..."
          class="w-full rounded-lg border border-white/10 bg-[#111113] py-2 pl-9 pr-3 text-sm text-white placeholder:text-white/40 outline-none focus:border-amber-500/60"
        />
      </div>

      <div class="flex items-center gap-2">
        <label class="text-xs font-medium text-white/50">Status:</label>
        <select
          v-model="selectedStatus"
          class="rounded-lg border border-white/10 bg-[#111113] px-3 py-2 text-xs text-white outline-none focus:border-amber-500/60"
        >
          <option v-for="st in statuses" :key="st" :value="st">{{ st }}</option>
        </select>
      </div>
    </div>

    <!-- Tickets table -->
    <div class="overflow-hidden rounded-xl border border-white/10 bg-[#141416]">
      <div class="flex items-center justify-between border-b border-white/10 px-5 py-4">
        <h2 class="text-base font-semibold">Tickets ({{ filteredTickets.length }})</h2>
      </div>
      <div class="overflow-x-auto">
        <table class="w-full text-left text-sm">
          <thead>
            <tr class="text-xs text-white/40">
              <th class="px-5 py-3 font-medium">Ticket ID</th>
              <th class="px-5 py-3 font-medium">Event</th>
              <th class="px-5 py-3 font-medium">Buyer</th>
              <th class="px-5 py-3 font-medium">Tier</th>
              <th class="px-5 py-3 font-medium">Price</th>
              <th class="px-5 py-3 text-right font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="t in filteredTickets" :key="t.id" class="border-t border-white/5 transition-colors hover:bg-white/[0.03]">
              <td class="px-5 py-4 font-mono text-xs text-white/50">{{ t.id }}</td>
              <td class="px-5 py-4 font-medium text-white">{{ t.event }}</td>
              <td class="px-5 py-4 text-white/70">{{ t.buyer }}</td>
              <td class="px-5 py-4 text-white/60">{{ t.tier }}</td>
              <td class="px-5 py-4 font-medium text-white">{{ t.price }}</td>
              <td class="px-5 py-4 text-right">
                <span class="rounded-full px-2.5 py-1 text-xs font-medium border" :class="statusStyle[t.status]">
                  {{ t.status }}
                </span>
              </td>
            </tr>
            <tr v-if="filteredTickets.length === 0">
              <td colspan="6" class="px-5 py-8 text-center text-sm text-white/40">
                No tickets found matching your search.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </main>
</template>