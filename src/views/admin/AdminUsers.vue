<script setup>
import { ref, computed } from "vue";
import {
  Search,
  Plus,
  Users,
  UserCheck,
  Shield,
  ArrowUpRight,
  Mail,
  Phone,
  Edit,
  Trash2,
  X,
  Lock,
} from "lucide-vue-next";

const stats = [
  {
    label: "Total Registered Users",
    value: "18,920",
    change: "+8.4% this month",
    trend: "up",
    icon: Users,
    color: "bg-teal-50 text-teal-600",
  },
  {
    label: "Active Customers",
    value: "15,240",
    change: "80.5% active buyers",
    trend: "up",
    icon: UserCheck,
    color: "bg-emerald-50 text-emerald-600",
  },
  {
    label: "Staff & Administrators",
    value: "142",
    change: "+5 this week",
    trend: "up",
    icon: Shield,
    color: "bg-purple-50 text-purple-600",
  },
];

const searchQuery = ref("");
const selectedRole = ref("All");
const selectedStatus = ref("All");

const users = ref([
  {
    id: 101,
    name: "Sarah Jenkins",
    email: "sarah.j@example.com",
    phone: "+1 (555) 234-5678",
    role: "customer",
    joinedDate: "Mar 12, 2024",
    status: "active",
  },
  {
    id: 102,
    name: "Marcus Reed",
    email: "m.reed@urbanbeats.org",
    phone: "+1 (555) 890-1234",
    role: "organizer",
    joinedDate: "Jan 18, 2024",
    status: "active",
  },
  {
    id: 103,
    name: "Elena Rodriguez",
    email: "elena.r@techventures.io",
    phone: "+1 (555) 432-8765",
    role: "customer",
    joinedDate: "Feb 05, 2024",
    status: "active",
  },
  {
    id: 104,
    name: "Thomas Chen",
    email: "thomas.c@cloudmail.com",
    phone: "+1 (555) 345-9876",
    role: "customer",
    joinedDate: "May 22, 2024",
    status: "inactive",
  },
  {
    id: 105,
    name: "Aria Montgomery",
    email: "aria.admin@eventhub.com",
    phone: "+1 (555) 123-4567",
    role: "admin",
    joinedDate: "Jan 01, 2024",
    status: "active",
  },
  {
    id: 106,
    name: "David Kim",
    email: "david.kim99@spamexample.com",
    phone: "+1 (555) 999-0000",
    role: "customer",
    joinedDate: "Jun 14, 2024",
    status: "suspended",
  },
]);

const roles = ["All", "admin", "organizer", "customer"];
const statuses = ["All", "active", "inactive", "suspended"];

const roleStyle = {
  admin: "bg-purple-50 text-purple-700 border-purple-200",
  organizer: "bg-amber-50 text-amber-700 border-amber-200",
  customer: "bg-slate-100 text-slate-700 border-slate-200",
};

const statusStyle = {
  active: "bg-emerald-50 text-emerald-700 border-emerald-200",
  inactive: "bg-slate-100 text-slate-500 border-slate-200",
  suspended: "bg-rose-50 text-rose-700 border-rose-200",
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
      u.id.toString().includes(searchQuery.value.toLowerCase());

    const matchesRole =
      selectedRole.value === "All" || u.role === selectedRole.value;

    const matchesStatus =
      selectedStatus.value === "All" || u.status === selectedStatus.value;

    return matchesSearch && matchesRole && matchesStatus;
  });
});

// Modal State
const isModalOpen = ref(false);
const editingUser = ref(null);
const form = ref({
  name: "",
  email: "",
  password: "",
  phone: "",
  role: "customer",
  status: "active",
});

function openCreateModal() {
  editingUser.value = null;
  form.value = {
    name: "",
    email: "",
    password: "",
    phone: "",
    role: "customer",
    status: "active",
  };
  isModalOpen.value = true;
}

function openEditModal(u) {
  editingUser.value = u;
  form.value = { ...u, password: "" };
  isModalOpen.value = true;
}

function saveUser() {
  if (!form.value.name.trim() || !form.value.email.trim()) return;

  if (editingUser.value) {
    const idx = users.value.findIndex((u) => u.id === editingUser.value.id);
    if (idx !== -1) {
      users.value[idx] = {
        ...users.value[idx],
        ...form.value,
      };
    }
  } else {
    const newId = Math.max(...users.value.map((u) => u.id), 0) + 1;
    users.value.unshift({
      id: newId,
      ...form.value,
      joinedDate: "Today",
    });
  }
  isModalOpen.value = false;
}

function deleteUser(id) {
  if (confirm("Are you sure you want to delete this user?")) {
    users.value = users.value.filter((u) => u.id !== id);
  }
}
</script>

<template>
  <main class="min-h-screen flex-1 bg-slate-50 px-8 py-8 text-slate-800">
    <!-- Header -->
    <div class="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <div class="flex items-center gap-2.5">
          <h1 class="text-3xl font-extrabold tracking-tight text-slate-900">Users Management</h1>
          <span class="rounded-md bg-teal-100 border border-teal-200 px-2.5 py-0.5 text-xs text-teal-800 font-mono font-medium">
            manage_users
          </span>
        </div>
        <p class="mt-1 text-sm text-slate-500">Manage customer accounts, organizers, administrators, and permissions.</p>
      </div>
      <div class="flex items-center gap-3">
        <button
          type="button"
          @click="openCreateModal"
          class="flex items-center gap-2 rounded-lg bg-amber-500 px-4 py-2.5 text-sm font-semibold text-slate-950 shadow-sm transition-all hover:bg-amber-600 hover:shadow"
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
          placeholder="Search by name, email, user ID..."
          class="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm text-slate-800 placeholder:text-slate-400 outline-none shadow-sm transition-all focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
        />
      </div>

      <div class="flex flex-wrap items-center gap-3">
        <!-- Role Filter -->
        <div class="flex items-center gap-2">
          <label class="text-xs font-semibold text-slate-500">Role:</label>
          <select
            v-model="selectedRole"
            class="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 outline-none shadow-sm focus:border-amber-500 capitalize"
          >
            <option v-for="r in roles" :key="r" :value="r">{{ r }}</option>
          </select>
        </div>

        <!-- Status Filter -->
        <div class="flex items-center gap-2">
          <label class="text-xs font-semibold text-slate-500">Status:</label>
          <select
            v-model="selectedStatus"
            class="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 outline-none shadow-sm focus:border-amber-500 capitalize"
          >
            <option v-for="st in statuses" :key="st" :value="st">{{ st }}</option>
          </select>
        </div>
      </div>
    </div>

    <!-- Users Table -->
    <div class="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div class="flex items-center justify-between border-b border-slate-200 px-6 py-4">
        <h2 class="text-base font-bold text-slate-900">User Directory ({{ filteredUsers.length }})</h2>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full text-left text-sm">
          <thead class="bg-slate-50/70 border-b border-slate-200">
            <tr class="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              <th class="px-6 py-3">User Profile</th>
              <th class="px-6 py-3">Contact</th>
              <th class="px-6 py-3">Role</th>
              <th class="px-6 py-3">Joined Date</th>
              <th class="px-6 py-3">Status</th>
              <th class="px-6 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr
              v-for="u in filteredUsers"
              :key="u.id"
              class="transition-colors hover:bg-slate-50/80"
            >
              <td class="px-6 py-4">
                <div class="flex items-center gap-3">
                  <span class="flex h-8 w-8 items-center justify-center rounded-full bg-amber-50 font-bold text-xs text-amber-700 border border-amber-200 shadow-sm">
                    {{ initials(u.name) }}
                  </span>
                  <div>
                    <p class="font-semibold text-slate-900">{{ u.name }}</p>
                    <p class="text-xs text-slate-400 font-mono">ID: #USR-{{ u.id }}</p>
                  </div>
                </div>
              </td>
              <td class="px-6 py-4 text-slate-600">
                <div class="flex items-center gap-1.5 text-xs">
                  <Mail :size="13" class="text-slate-400" />
                  {{ u.email }}
                </div>
                <div v-if="u.phone" class="mt-0.5 flex items-center gap-1.5 text-[11px] text-slate-400">
                  <Phone :size="11" />
                  {{ u.phone }}
                </div>
              </td>
              <td class="px-6 py-4">
                <span
                  class="rounded-full border px-2.5 py-0.5 text-[11px] font-semibold capitalize"
                  :class="roleStyle[u.role]"
                >
                  {{ u.role }}
                </span>
              </td>
              <td class="px-6 py-4 text-xs text-slate-500">
                {{ u.joinedDate }}
              </td>
              <td class="px-6 py-4">
                <span
                  class="rounded-full border px-2.5 py-0.5 text-[11px] font-semibold capitalize"
                  :class="statusStyle[u.status]"
                >
                  {{ u.status }}
                </span>
              </td>
              <td class="px-6 py-4 text-right">
                <div class="flex items-center justify-end gap-1.5">
                  <button
                    type="button"
                    @click="openEditModal(u)"
                    class="rounded-lg border border-slate-200 bg-slate-50 p-1.5 text-slate-600 hover:border-amber-500 hover:text-amber-700 hover:bg-amber-50"
                  >
                    <Edit :size="14" />
                  </button>
                  <button
                    type="button"
                    @click="deleteUser(u.id)"
                    class="rounded-lg border border-rose-200 bg-rose-50 p-1.5 text-rose-600 hover:bg-rose-100"
                  >
                    <Trash2 :size="14" />
                  </button>
                </div>
              </td>
            </tr>
            <tr v-if="filteredUsers.length === 0">
              <td colspan="6" class="px-6 py-8 text-center text-sm text-slate-400">
                No users found matching your search.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Create / Edit User Modal -->
    <div
      v-if="isModalOpen"
      class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm"
    >
      <div class="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
        <div class="mb-5 flex items-center justify-between border-b border-slate-200 pb-4">
          <h3 class="text-lg font-bold text-slate-900">
            {{ editingUser ? "Edit User Account" : "Add New User" }}
          </h3>
          <button @click="isModalOpen = false" class="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700">
            <X :size="18" />
          </button>
        </div>

        <form @submit.prevent="saveUser" class="space-y-4">
          <div>
            <label class="mb-1 block text-xs font-semibold text-slate-700">Full Name *</label>
            <input
              v-model="form.name"
              type="text"
              required
              placeholder="e.g. John Doe"
              class="w-full rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2 text-sm text-slate-900 outline-none focus:bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
            />
          </div>

          <div>
            <label class="mb-1 block text-xs font-semibold text-slate-700">Email Address *</label>
            <input
              v-model="form.email"
              type="email"
              required
              placeholder="user@example.com"
              class="w-full rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2 text-sm text-slate-900 outline-none focus:bg-white focus:border-amber-500"
            />
          </div>

          <div v-if="!editingUser">
            <label class="mb-1 block text-xs font-semibold text-slate-700">Password *</label>
            <input
              v-model="form.password"
              type="password"
              required
              placeholder="••••••••"
              class="w-full rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2 text-sm text-slate-900 outline-none focus:bg-white focus:border-amber-500"
            />
          </div>

          <div>
            <label class="mb-1 block text-xs font-semibold text-slate-700">Phone Number</label>
            <input
              v-model="form.phone"
              type="text"
              placeholder="+1 (555) 000-0000"
              class="w-full rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2 text-sm text-slate-900 outline-none focus:bg-white focus:border-amber-500"
            />
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="mb-1 block text-xs font-semibold text-slate-700">Role *</label>
              <select
                v-model="form.role"
                class="w-full rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2 text-sm text-slate-900 outline-none focus:bg-white focus:border-amber-500 capitalize"
              >
                <option value="customer">Customer</option>
                <option value="organizer">Organizer</option>
                <option value="admin">Administrator</option>
              </select>
            </div>
            <div>
              <label class="mb-1 block text-xs font-semibold text-slate-700">Status</label>
              <select
                v-model="form.status"
                class="w-full rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2 text-sm text-slate-900 outline-none focus:bg-white focus:border-amber-500 capitalize"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="suspended">Suspended</option>
              </select>
            </div>
          </div>

          <div class="mt-6 flex justify-end gap-3 pt-2">
            <button
              type="button"
              @click="isModalOpen = false"
              class="rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              class="rounded-lg bg-amber-500 px-5 py-2 text-xs font-semibold text-slate-950 shadow-sm transition-all hover:bg-amber-600"
            >
              {{ editingUser ? "Save Changes" : "Create User" }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </main>
</template>
