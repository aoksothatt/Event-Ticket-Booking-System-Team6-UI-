<script setup>
import { ref, computed } from "vue";
import { Search, Plus, Building2, ShieldCheck, DollarSign, ArrowUpRight, Mail } from "lucide-vue-next";

const stats = [
  { label: "Total Organizers", value: "128", change: "+6 this month", icon: Building2 },
  { label: "Verified", value: "104", change: "81% of organizers", icon: ShieldCheck },
  { label: "Payouts This Month", value: "$412K", change: "+11.2% from last month", icon: DollarSign },
];

const searchQuery = ref("");
const selectedStatus = ref("All");

const organizers = ref([
  { name: "Wavelength Live", contact: "bookings@wavelength.live", events: 14, revenue: "$540,200", status: "Verified" },
  { name: "Civic Symphony Society", contact: "admin@civicsymphony.org", events: 6, revenue: "$88,900", status: "Verified" },
  { name: "Summit Conferences Co.", contact: "hello@summitco.io", events: 3, revenue: "$402,000", status: "Verified" },
  { name: "Laugh Track Presents", contact: "team@laughtrack.com", events: 9, revenue: "$61,300", status: "Pending" },
  { name: "Gallery Nine", contact: "contact@gallerynine.art", events: 2, revenue: "$90,000", status: "Verified" },
  { name: "Street Eats Collective", contact: "info@streeteats.co", events: 1, revenue: "$0", status: "Suspended" },
]);

const statusStyle = {
  Verified: "bg-emerald-500/10 text-emerald-400",
  Pending: "bg-amber-500/10 text-amber-400",
  Suspended: "bg-rose-500/10 text-rose-400",
};

function initials(name) {
  return name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

const filteredOrganizers = computed(() => {
  return organizers.value.filter((org) => {
    const matchesSearch =
      org.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      org.contact.toLowerCase().includes(searchQuery.value.toLowerCase());

    const matchesStatus =
      selectedStatus.value === "All" || org.status === selectedStatus.value;

    return matchesSearch && matchesStatus;
  });
});
</script>

<template>
  <main class="min-h-screen flex-1 bg-[#0B0B0C] px-8 py-8 text-white">
    <!-- Header -->
    <div class="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h1 class="text-3xl font-bold tracking-tight">Organizers</h1>
        <p class="mt-1 text-sm text-white/50">Accounts hosting and managing events on the platform.</p>
      </div>
      <div class="flex items-center gap-3">
        <button class="flex items-center gap-2 rounded-lg bg-amber-500 px-4 py-2.5 text-sm font-medium text-black transition-opacity hover:opacity-90 shadow-md shadow-amber-500/10">
          <Plus :size="16" :stroke-width="2.5" />
          Invite Organizer
        </button>
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
          placeholder="Search organizers by name or email..."
          class="w-full rounded-lg border border-white/10 bg-[#111113] py-2 pl-9 pr-3 text-sm text-white placeholder:text-white/40 outline-none focus:border-amber-500/60"
        />
      </div>

      <div class="flex items-center gap-2">
        <label class="text-xs font-medium text-white/50">Status:</label>
        <select
          v-model="selectedStatus"
          class="rounded-lg border border-white/10 bg-[#111113] px-3 py-2 text-xs text-white outline-none focus:border-amber-500/60"
        >
          <option value="All">All</option>
          <option value="Verified">Verified</option>
          <option value="Pending">Pending</option>
          <option value="Suspended">Suspended</option>
        </select>
      </div>
    </div>

    <!-- Organizers table -->
    <div class="overflow-hidden rounded-xl border border-white/10 bg-[#141416]">
      <div class="flex items-center justify-between border-b border-white/10 px-5 py-4">
        <h2 class="text-base font-semibold">All Organizers ({{ filteredOrganizers.length }})</h2>
      </div>
      <div class="overflow-x-auto">
        <table class="w-full text-left text-sm">
          <thead>
            <tr class="text-xs text-white/40">
              <th class="px-5 py-3 font-medium">Organizer</th>
              <th class="px-5 py-3 font-medium">Contact Email</th>
              <th class="px-5 py-3 font-medium">Events Hosted</th>
              <th class="px-5 py-3 font-medium">Total Revenue</th>
              <th class="px-5 py-3 text-right font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="org in filteredOrganizers" :key="org.name" class="border-t border-white/5 transition-colors hover:bg-white/[0.03]">
              <td class="px-5 py-4">
                <div class="flex items-center gap-3">
                  <span class="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-xs font-medium text-white/70">
                    {{ initials(org.name) }}
                  </span>
                  <span class="font-medium text-white">{{ org.name }}</span>
                </div>
              </td>
              <td class="px-5 py-4 text-white/60">
                <div class="flex items-center gap-1.5">
                  <Mail :size="14" class="text-white/40" />
                  {{ org.contact }}
                </div>
              </td>
              <td class="px-5 py-4 text-white/70">{{ org.events }} events</td>
              <td class="px-5 py-4 font-medium text-white">{{ org.revenue }}</td>
              <td class="px-5 py-4 text-right">
                <span class="rounded-full px-2.5 py-1 text-xs font-medium" :class="statusStyle[org.status]">
                  {{ org.status }}
                </span>
              </td>
            </tr>
            <tr v-if="filteredOrganizers.length === 0">
              <td colspan="5" class="px-5 py-8 text-center text-sm text-white/40">
                No organizers found matching your search.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </main>
</template>
