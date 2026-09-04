<script setup>
import { ref, computed, onMounted } from "vue";
import { adminApi } from "@/api/admin.js";
import {
  Building2,
  Search,
  Plus,
  ShieldCheck,
  ShieldAlert,
  DollarSign,
  ArrowUpRight,
  Mail,
  Phone,
  Globe,
  Edit,
  Trash2,
  X,
  CheckCircle2,
} from "lucide-vue-next";

const loading = ref(true);
const error = ref(null);

const organizers = ref([]);

async function fetchOrganizers() {
  loading.value = true;
  error.value = null;
  try {
    const res = await adminApi.getOrganizers();
    organizers.value = res.data.data ?? res.data;
  } catch (e) {
    error.value = e.response?.data?.message || "Failed to load organizers.";
  } finally {
    loading.value = false;
  }
}

const stats = computed(() => {
  const total = organizers.value.length;
  const verified = organizers.value.filter((o) => o.is_verified).length;
  return [
    { label: "Total Organizers", value: String(total), change: "", icon: Building2, color: "bg-rose-50 text-rose-600" },
    { label: "Verified Hosts", value: String(verified), change: total ? `${Math.round((verified / total) * 100)}% verification rate` : "", icon: ShieldCheck, color: "bg-emerald-50 text-emerald-600" },
    { label: "Pending Review", value: String(total - verified), change: "", icon: ShieldAlert, color: "bg-amber-50 text-amber-600" },
  ];
});

const searchQuery = ref("");
const selectedStatus = ref("All");

const statusStyle = {
  Verified: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Pending: "bg-amber-50 text-amber-700 border-amber-200",
  Suspended: "bg-rose-50 text-rose-700 border-rose-200",
};

function deriveStatus(org) {
  return org.is_verified ? "Verified" : "Pending";
}

function initials(name) {
  return (name || "")
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

const filteredOrganizers = computed(() => {
  return organizers.value.filter((org) => {
    const contactName = org.user?.name || "";
    const email = org.user?.email || "";
    const phone = org.phone || org.user?.phone || "";
    const status = deriveStatus(org);

    const matchesSearch =
      org.company_name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      contactName.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      email.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      phone.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      (org.website || "").toLowerCase().includes(searchQuery.value.toLowerCase());

    const matchesStatus =
      selectedStatus.value === "All" || status === selectedStatus.value;

    return matchesSearch && matchesStatus;
  });
});

// Modal State
const isModalOpen = ref(false);
const editingOrganizer = ref(null);
const form = ref({
  company_name: "",
  contact_name: "",
  email: "",
  phone: "",
  website: "",
  description: "",
  is_verified: true,
});

function openCreateModal() {
  editingOrganizer.value = null;
  form.value = {
    company_name: "",
    contact_name: "",
    email: "",
    phone: "",
    website: "",
    description: "",
    is_verified: true,
  };
  isModalOpen.value = true;
}

function openEditModal(org) {
  editingOrganizer.value = org;
  form.value = {
    company_name: org.company_name,
    contact_name: org.user?.name || "",
    email: org.user?.email || "",
    phone: org.phone || org.user?.phone || "",
    website: org.website || "",
    description: org.description || "",
    is_verified: org.is_verified,
  };
  isModalOpen.value = true;
}

async function toggleVerify(org) {
  const newVerified = !org.is_verified;
  try {
    await adminApi.updateOrganizer(org.id, { is_verified: newVerified });
    org.is_verified = newVerified;
  } catch (e) {
    alert(e.response?.data?.message || "Failed to update verification status.");
  }
}

async function saveOrganizer() {
  if (!form.value.company_name.trim()) return;

  const payload = {
    company_name: form.value.company_name,
    contact_name: form.value.contact_name,
    email: form.value.email,
    phone: form.value.phone,
    website: form.value.website,
    description: form.value.description,
    is_verified: form.value.is_verified,
  };

  try {
    if (editingOrganizer.value) {
      await adminApi.updateOrganizer(editingOrganizer.value.id, payload);
    } else {
      await adminApi.createOrganizer(payload);
    }
    isModalOpen.value = false;
    await fetchOrganizers();
  } catch (e) {
    alert(e.response?.data?.message || "Failed to save organizer.");
  }
}

async function deleteOrganizer(id) {
  if (!confirm("Are you sure you want to delete this organizer?")) return;
  try {
    await adminApi.deleteOrganizer(id);
    await fetchOrganizers();
  } catch (e) {
    alert(e.response?.data?.message || "Failed to delete organizer.");
  }
}

onMounted(fetchOrganizers);
</script>

<template>
  <main class="min-h-screen flex-1 bg-slate-50 px-8 py-8 text-slate-800">
    <!-- Header -->
    <div class="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <div class="flex items-center gap-2.5">
          <h1 class="text-3xl font-extrabold tracking-tight text-slate-900">Organizers Management</h1>
          <span class="rounded-md bg-rose-100 border border-rose-200 px-2.5 py-0.5 text-xs text-rose-800 font-mono font-medium">
            manage_organizers
          </span>
        </div>
        <p class="mt-1 text-sm text-slate-500">Manage event hosting companies, merchant credentials, and verification status.</p>
      </div>
      <div class="flex items-center gap-3">
        <button
          type="button"
          @click="openCreateModal"
          class="flex items-center gap-2 rounded-lg bg-amber-500 px-4 py-2.5 text-sm font-semibold text-slate-950 shadow-sm transition-all hover:bg-amber-600 hover:shadow"
        >
          <Plus :size="16" :stroke-width="2.5" />
          Invite Organizer
        </button>
      </div>
    </div>

    <!-- Loading state -->
    <div v-if="loading" class="mb-8 flex items-center justify-center py-16">
      <div class="flex items-center gap-3 text-sm text-slate-500">
        <svg class="h-5 w-5 animate-spin text-amber-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        Loading organizers...
      </div>
    </div>

    <!-- Error state -->
    <div v-else-if="error" class="mb-8 rounded-xl border border-rose-200 bg-rose-50 p-6 text-center">
      <p class="text-sm font-semibold text-rose-700">{{ error }}</p>
      <button @click="fetchOrganizers" class="mt-3 rounded-lg bg-rose-500 px-4 py-2 text-xs font-semibold text-white hover:bg-rose-600">Retry</button>
    </div>

    <template v-else>
      <!-- Stat cards -->
      <div class="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div v-for="stat in stats" :key="stat.label" class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div class="mb-4 flex items-start justify-between">
            <p class="text-xs font-semibold text-slate-500 uppercase tracking-wider">{{ stat.label }}</p>
            <span class="flex h-8 w-8 items-center justify-center rounded-lg shadow-sm" :class="stat.color">
              <component :is="stat.icon" :size="16" />
            </span>
          </div>
          <p class="text-2xl font-bold text-slate-900">{{ stat.value }}</p>
          <p v-if="stat.change" class="mt-2 flex items-center gap-1 text-xs font-medium text-emerald-600">
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
            placeholder="Search organizers by company, email, phone, website..."
            class="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm text-slate-800 placeholder:text-slate-400 outline-none shadow-sm transition-all focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
          />
        </div>

        <div class="flex items-center gap-2">
          <label class="text-xs font-semibold text-slate-500">Status:</label>
          <select
            v-model="selectedStatus"
            class="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 outline-none shadow-sm focus:border-amber-500 capitalize"
          >
            <option value="All">All Organizers</option>
            <option value="Verified">Verified</option>
            <option value="Pending">Pending Review</option>
            <option value="Suspended">Suspended</option>
          </select>
        </div>
      </div>

      <!-- Organizers table -->
      <div class="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div class="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <h2 class="text-base font-bold text-slate-900">Registered Event Organizers ({{ filteredOrganizers.length }})</h2>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full text-left text-sm">
            <thead class="bg-slate-50/70 border-b border-slate-200">
              <tr class="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th class="px-6 py-3">Company Name</th>
                <th class="px-6 py-3">Contact & Website</th>
                <th class="px-6 py-3">Phone</th>
                <th class="px-6 py-3">Verification</th>
                <th class="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <tr v-for="org in filteredOrganizers" :key="org.id" class="transition-colors hover:bg-slate-50/80">
                <td class="px-6 py-4">
                  <div class="flex items-center gap-3">
                    <span class="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 font-bold text-xs text-amber-700 border border-amber-200 shadow-sm">
                      {{ initials(org.user?.name || org.company_name) }}
                    </span>
                    <div>
                      <p class="font-semibold text-slate-900">{{ org.company_name }}</p>
                      <p class="text-xs text-slate-400">{{ org.user?.name || "N/A" }}</p>
                    </div>
                  </div>
                </td>
                <td class="px-6 py-4">
                  <div class="flex items-center gap-1.5 text-xs text-slate-700">
                    <Mail :size="13" class="text-slate-400" />
                    {{ org.user?.email || "N/A" }}
                  </div>
                  <div v-if="org.website" class="mt-0.5 flex items-center gap-1.5 text-[11px] text-amber-600 font-medium">
                    <Globe :size="12" class="text-slate-400" />
                    {{ org.website }}
                  </div>
                </td>
                <td class="px-6 py-4 text-xs text-slate-600">
                  {{ org.phone || org.user?.phone || "N/A" }}
                </td>
                <td class="px-6 py-4">
                  <button
                    type="button"
                    @click="toggleVerify(org)"
                    class="rounded-full border px-2.5 py-0.5 text-[11px] font-semibold cursor-pointer transition-all hover:opacity-80"
                    :class="statusStyle[deriveStatus(org)]"
                    title="Click to toggle verification status"
                  >
                    {{ deriveStatus(org) }}
                  </button>
                </td>
                <td class="px-6 py-4 text-right">
                  <div class="flex items-center justify-end gap-1.5">
                    <button
                      type="button"
                      @click="openEditModal(org)"
                      class="rounded-lg border border-slate-200 bg-slate-50 p-1.5 text-slate-600 hover:border-amber-500 hover:text-amber-700 hover:bg-amber-50"
                    >
                      <Edit :size="14" />
                    </button>
                    <button
                      type="button"
                      @click="deleteOrganizer(org.id)"
                      class="rounded-lg border border-rose-200 bg-rose-50 p-1.5 text-rose-600 hover:bg-rose-100"
                    >
                      <Trash2 :size="14" />
                    </button>
                  </div>
                </td>
              </tr>
              <tr v-if="filteredOrganizers.length === 0">
                <td colspan="5" class="px-6 py-8 text-center text-sm text-slate-400">
                  No organizers found matching your search.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </template>

    <!-- Create / Edit Modal -->
    <div
      v-if="isModalOpen"
      class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm"
    >
      <div class="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
        <div class="mb-5 flex items-center justify-between border-b border-slate-200 pb-4">
          <h3 class="text-lg font-bold text-slate-900">
            {{ editingOrganizer ? "Edit Organizer Profile" : "Invite Organizer" }}
          </h3>
          <button @click="isModalOpen = false" class="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700">
            <X :size="18" />
          </button>
        </div>

        <form @submit.prevent="saveOrganizer" class="space-y-4">
          <div>
            <label class="mb-1 block text-xs font-semibold text-slate-700">Company / Organization Name *</label>
            <input
              v-model="form.company_name"
              type="text"
              required
              placeholder="e.g. Wavelength Live Productions"
              class="w-full rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2 text-sm text-slate-900 outline-none focus:bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
            />
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="mb-1 block text-xs font-semibold text-slate-700">Contact Person</label>
              <input
                v-model="form.contact_name"
                type="text"
                placeholder="Manager full name"
                class="w-full rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2 text-sm text-slate-900 outline-none focus:bg-white focus:border-amber-500"
              />
            </div>
            <div>
              <label class="mb-1 block text-xs font-semibold text-slate-700">Contact Email *</label>
              <input
                v-model="form.email"
                type="email"
                required
                placeholder="bookings@company.com"
                class="w-full rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2 text-sm text-slate-900 outline-none focus:bg-white focus:border-amber-500"
              />
            </div>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="mb-1 block text-xs font-semibold text-slate-700">Phone Number</label>
              <input
                v-model="form.phone"
                type="text"
                placeholder="+1 (555) 000-0000"
                class="w-full rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2 text-sm text-slate-900 outline-none focus:bg-white focus:border-amber-500"
              />
            </div>
            <div>
              <label class="mb-1 block text-xs font-semibold text-slate-700">Website</label>
              <input
                v-model="form.website"
                type="url"
                placeholder="https://company.com"
                class="w-full rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2 text-sm text-slate-900 outline-none focus:bg-white focus:border-amber-500"
              />
            </div>
          </div>

          <div>
            <label class="mb-1 block text-xs font-semibold text-slate-700">Description</label>
            <textarea
              v-model="form.description"
              rows="3"
              placeholder="Brief description of the organizer..."
              class="w-full rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2 text-sm text-slate-900 outline-none focus:bg-white focus:border-amber-500"
            />
          </div>

          <div>
            <label class="mb-1 block text-xs font-semibold text-slate-700">Verification Status</label>
            <select
              v-model="form.is_verified"
              class="w-full rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2 text-sm text-slate-900 outline-none focus:bg-white focus:border-amber-500 capitalize"
            >
              <option :value="true">Verified (Enabled for ticket sales & payouts)</option>
              <option :value="false">Pending Review</option>
            </select>
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
              {{ editingOrganizer ? "Save Changes" : "Create Organizer" }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </main>
</template>
