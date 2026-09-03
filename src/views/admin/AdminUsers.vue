<script setup>
import { ref, computed } from "vue";
import {
  Search,
  Plus,
  Users,
  UserCheck,
  ShieldAlert,
  ArrowUpRight,
  Shield,
  Mail,
  MoreVertical,
} from "lucide-vue-next";

const stats = [
  {
    label: "Total Registered Users",
    value: "14,820",
    change: "+8.4% this month",
    trend: "up",
    icon: Users,
  },
  {
    label: "Active Ticket Buyers",
    value: "11,240",
    change: "75.8% conversion rate",
    trend: "up",
    icon: UserCheck,
  },
  {
    label: "Staff & Organizers",
    value: "142",
    change: "+5 this week",
    trend: "up",
    icon: Shield,
  },
];

const searchQuery = ref("");
const selectedRole = ref("All");
const selectedStatus = ref("All");

const users = ref([
  {
    id: "USR-101",
    name: "Sarah Jenkins",
    email: "sarah.j@example.com",
    role: "Customer",
    ticketsBought: 14,
    totalSpent: "$1,120.00",
    joinedDate: "Mar 12, 2024",
    status: "Active",
  },
  {
    id: "USR-102",
    name: "Marcus Reed",
    email: "m.reed@urbanbeats.org",
    role: "Organizer",
    ticketsBought: 0,
    totalSpent: "$0.00",
    joinedDate: "Jan 18, 2024",
    status: "Active",
  },
  {
    id: "USR-103",
    name: "Elena Rodriguez",
    email: "elena.r@techventures.io",
    role: "Customer",
    ticketsBought: 8,
    totalSpent: "$2,450.00",
    joinedDate: "Feb 05, 2024",
    status: "Active",
  },
  {
    id: "USR-104",
    name: "Thomas Chen",
    email: "thomas.c@cloudmail.com",
    role: "Customer",
    ticketsBought: 3,
    totalSpent: "$135.00",
    joinedDate: "May 22, 2024",
    status: "Inactive",
  },
  {
    id: "USR-105",
    name: "Aria Montgomery",
    email: "aria.admin@eventhub.com",
    role: "Admin",
    ticketsBought: 2,
    totalSpent: "$190.00",
    joinedDate: "Jan 01, 2024",
    status: "Active",
  },
  {
    id: "USR-106",
    name: "David Kim",
    email: "david.kim99@spamexample.com",
    role: "Customer",
    ticketsBought: 1,
    totalSpent: "$45.00",
    joinedDate: "Jun 14, 2024",
    status: "Suspended",
  },
]);

const roles = ["All", "Customer", "Organizer", "Admin"];
const statuses = ["All", "Active", "Inactive", "Suspended"];

const roleStyle = {
  Admin: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  Organizer: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  Customer: "bg-white/10 text-white/70 border-white/10",
};

const statusStyle = {
  Active: "bg-emerald-500/10 text-emerald-400",
  Inactive: "bg-white/10 text-white/50",
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

const filteredUsers = computed(() => {
  return users.value.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      u.id.toLowerCase().includes(searchQuery.value.toLowerCase());

    const matchesRole =
      selectedRole.value === "All" || u.role === selectedRole.value;

    const matchesStatus =
      selectedStatus.value === "All" || u.status === selectedStatus.value;

    return matchesSearch && matchesRole && matchesStatus;
  });
});
</script>

<template>
  <main class="min-h-screen flex-1 bg-[#0B0B0C] px-8 py-8 text-white">
    <!-- Header -->
    <div class="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h1 class="text-3xl font-bold tracking-tight">Users Management</h1>
        <p class="mt-1 text-sm text-white/50">Manage customer accounts, organizers, and permissions.</p>
      </div>
      <div class="flex items-center gap-3">
        <button
          type="button"
          class="flex items-center gap-2 rounded-lg bg-amber-500 px-4 py-2.5 text-sm font-medium text-black transition-opacity hover:opacity-90 shadow-md shadow-amber-500/10"
        >
          <Plus :size="16" :stroke-width="2.5" />
          Add User
        </button>
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
          placeholder="Search by name, email, user ID..."
          class="w-full rounded-lg border border-white/10 bg-[#111113] py-2 pl-9 pr-3 text-sm text-white placeholder:text-white/40 outline-none focus:border-amber-500/60"
        />
      </div>

      <div class="flex flex-wrap items-center gap-3">
        <!-- Role Filter -->
        <div class="flex items-center gap-2">
          <label class="text-xs font-medium text-white/50">Role:</label>
          <select
            v-model="selectedRole"
            class="rounded-lg border border-white/10 bg-[#111113] px-3 py-2 text-xs text-white outline-none focus:border-amber-500/60"
          >
            <option v-for="r in roles" :key="r" :value="r">{{ r }}</option>
          </select>
        </div>

        <!-- Status Filter -->
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
    </div>

    <!-- Users Table -->
    <div class="overflow-hidden rounded-xl border border-white/10 bg-[#141416]">
      <div class="flex items-center justify-between border-b border-white/10 px-5 py-4">
        <h2 class="text-base font-semibold">All Users ({{ filteredUsers.length }})</h2>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full text-left text-sm">
          <thead>
            <tr class="text-xs text-white/40">
              <th class="px-5 py-3 font-medium">User</th>
              <th class="px-5 py-3 font-medium">Email</th>
              <th class="px-5 py-3 font-medium">Role</th>
              <th class="px-5 py-3 font-medium">Tickets</th>
              <th class="px-5 py-3 font-medium">Total Spent</th>
              <th class="px-5 py-3 font-medium">Joined Date</th>
              <th class="px-5 py-3 text-right font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="u in filteredUsers"
              :key="u.id"
              class="border-t border-white/5 transition-colors hover:bg-white/[0.03]"
            >
              <td class="px-5 py-4">
                <div class="flex items-center gap-3">
                  <span class="flex h-8 w-8 items-center justify-center rounded-full bg-amber-500/10 font-semibold text-xs text-amber-400">
                    {{ initials(u.name) }}
                  </span>
                  <div>
                    <p class="font-medium text-white">{{ u.name }}</p>
                    <p class="text-xs text-white/40">{{ u.id }}</p>
                  </div>
                </div>
              </td>
              <td class="px-5 py-4 text-white/60">
                <div class="flex items-center gap-1.5">
                  <Mail :size="14" class="text-white/40" />
                  {{ u.email }}
                </div>
              </td>
              <td class="px-5 py-4">
                <span
                  class="rounded-full border px-2.5 py-0.5 text-xs font-medium"
                  :class="roleStyle[u.role]"
                >
                  {{ u.role }}
                </span>
              </td>
              <td class="px-5 py-4 text-white/70">
                {{ u.ticketsBought }}
              </td>
              <td class="px-5 py-4 font-medium text-white">
                {{ u.totalSpent }}
              </td>
              <td class="px-5 py-4 text-xs text-white/50">
                {{ u.joinedDate }}
              </td>
              <td class="px-5 py-4 text-right">
                <span
                  class="rounded-full px-2.5 py-1 text-xs font-medium"
                  :class="statusStyle[u.status]"
                >
                  {{ u.status }}
                </span>
              </td>
            </tr>
            <tr v-if="filteredUsers.length === 0">
              <td colspan="7" class="px-5 py-8 text-center text-sm text-white/40">
                No users found matching your search.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </main>
</template>
