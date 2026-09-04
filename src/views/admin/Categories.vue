<script setup>
import { ref, computed, onMounted } from "vue";
import { adminApi } from "@/api/admin.js";
import {
  Layers,
  Search,
  Plus,
  Edit,
  Trash2,
  CheckCircle2,
  XCircle,
  Tag,
  ArrowUpRight,
  X,
} from "lucide-vue-next";

const categories = ref([]);
const isLoading = ref(true);
const error = ref(null);

const searchQuery = ref("");
const selectedStatus = ref("All");

function formatDate(dateStr) {
  if (!dateStr) return "N/A";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

const stats = computed(() => {
  const total = categories.value.length;
  const active = categories.value.filter((c) => c.status === "active").length;
  const inactive = total - active;
  return [
    { label: "Total Categories", value: total, change: `${active} active`, icon: Layers, color: "bg-sky-50 text-sky-600" },
    { label: "Active Categories", value: active, change: `${total ? Math.round((active / total) * 100) : 0}% currently in use`, icon: CheckCircle2, color: "bg-emerald-50 text-emerald-600" },
    { label: "Inactive Categories", value: inactive, change: `${inactive} currently hidden`, icon: Tag, color: "bg-amber-50 text-amber-600" },
  ];
});

async function fetchCategories() {
  isLoading.value = true;
  error.value = null;
  try {
    const response = await adminApi.getCategories();
    const payload = response.data;
    categories.value = Array.isArray(payload) ? payload : (payload.data || []);
  } catch (err) {
    error.value = err.response?.data?.message || err.message || "Failed to load categories.";
  } finally {
    isLoading.value = false;
  }
}

onMounted(fetchCategories);

const statusStyle = {
  active: "bg-emerald-50 text-emerald-700 border-emerald-200",
  inactive: "bg-slate-100 text-slate-500 border-slate-200",
};

const filteredCategories = computed(() => {
  return categories.value.filter((cat) => {
    const matchesSearch =
      cat.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      (cat.description || "").toLowerCase().includes(searchQuery.value.toLowerCase());

    const matchesStatus =
      selectedStatus.value === "All" || cat.status === selectedStatus.value;

    return matchesSearch && matchesStatus;
  });
});

// Modal State
const isModalOpen = ref(false);
const editingCategory = ref(null);
const isSaving = ref(false);
const form = ref({
  name: "",
  description: "",
  status: "active",
});

function openCreateModal() {
  editingCategory.value = null;
  form.value = { name: "", description: "", status: "active" };
  isModalOpen.value = true;
}

function openEditModal(category) {
  editingCategory.value = category;
  form.value = { ...category };
  isModalOpen.value = true;
}

function closeModal() {
  isModalOpen.value = false;
  editingCategory.value = null;
}

async function saveCategory() {
  if (!form.value.name.trim()) return;
  isSaving.value = true;
  try {
    if (editingCategory.value) {
      await adminApi.updateCategory(editingCategory.value.id, {
        name: form.value.name,
        description: form.value.description,
        status: form.value.status,
      });
    } else {
      await adminApi.createCategory({
        name: form.value.name,
        description: form.value.description,
        status: form.value.status,
      });
    }
    await fetchCategories();
    closeModal();
  } catch (err) {
    alert(err.response?.data?.message || err.message || "Failed to save category.");
  } finally {
    isSaving.value = false;
  }
}

async function deleteCategory(id) {
  if (confirm("Are you sure you want to delete this category?")) {
    try {
      await adminApi.deleteCategory(id);
      await fetchCategories();
    } catch (err) {
      alert(err.response?.data?.message || err.message || "Failed to delete category.");
    }
  }
}
</script>

<template>
  <main class="min-h-screen flex-1 bg-slate-50 px-8 py-8 text-slate-800">
    <!-- Header -->
    <div class="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <div class="flex items-center gap-2.5">
          <h1 class="text-3xl font-extrabold tracking-tight text-slate-900">Categories Management</h1>
          <span class="rounded-md bg-sky-100 border border-sky-200 px-2.5 py-0.5 text-xs text-sky-800 font-mono font-medium">
            manage_categories
          </span>
        </div>
        <p class="mt-1 text-sm text-slate-500">Manage event genres, classification tags, and catalog taxonomies.</p>
      </div>
      <div class="flex items-center gap-3">
        <button
          type="button"
          @click="openCreateModal"
          class="flex items-center gap-2 rounded-lg bg-amber-500 px-4 py-2.5 text-sm font-semibold text-slate-950 shadow-sm transition-all hover:bg-amber-600 hover:shadow"
        >
          <Plus :size="16" :stroke-width="2.5" />
          Add Category
        </button>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" class="mb-8 flex items-center justify-center py-12">
      <div class="flex items-center gap-3 text-slate-500">
        <svg class="h-5 w-5 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
        </svg>
        <span class="text-sm font-medium">Loading categories...</span>
      </div>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="mb-8 rounded-xl border border-rose-200 bg-rose-50 p-6 text-center">
      <XCircle :size="24" class="mx-auto mb-2 text-rose-400" />
      <p class="text-sm font-semibold text-rose-700">{{ error }}</p>
      <button @click="fetchCategories" class="mt-3 rounded-lg bg-rose-100 px-4 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-200">
        Retry
      </button>
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

      <!-- Search & Filter -->
      <div class="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div class="relative min-w-[260px] flex-1">
          <Search :size="16" class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search categories by name or description..."
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
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      <!-- Categories Table -->
      <div class="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div class="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <h2 class="text-base font-bold text-slate-900">Event Categories ({{ filteredCategories.length }})</h2>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full text-left text-sm">
            <thead class="bg-slate-50/70 border-b border-slate-200">
              <tr class="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th class="px-6 py-3">Category Name</th>
                <th class="px-6 py-3">Description</th>
                <th class="px-6 py-3">Status</th>
                <th class="px-6 py-3">Created Date</th>
                <th class="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <tr
                v-for="cat in filteredCategories"
                :key="cat.id"
                class="transition-colors hover:bg-slate-50/80"
              >
                <td class="px-6 py-4">
                  <div class="flex items-center gap-3">
                    <div class="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-50 text-sky-600 border border-sky-100 shadow-sm">
                      <Layers :size="16" />
                    </div>
                    <div>
                      <p class="font-semibold text-slate-900">{{ cat.name }}</p>
                      <p class="text-[10px] text-slate-400 font-mono">ID: #CAT-{{ cat.id }}</p>
                    </div>
                  </div>
                </td>
                <td class="px-6 py-4 text-xs text-slate-600 max-w-sm">
                  {{ cat.description || "No description provided." }}
                </td>
                <td class="px-6 py-4">
                  <span class="rounded-full border px-2.5 py-0.5 text-[11px] font-semibold capitalize" :class="statusStyle[cat.status]">
                    {{ cat.status }}
                  </span>
                </td>
                <td class="px-6 py-4 text-xs text-slate-500">
                  {{ formatDate(cat.created_at) }}
                </td>
                <td class="px-6 py-4 text-right">
                  <div class="flex items-center justify-end gap-1.5">
                    <button
                      type="button"
                      @click="openEditModal(cat)"
                      class="rounded-lg border border-slate-200 bg-slate-50 p-1.5 text-slate-600 hover:border-amber-500 hover:text-amber-700 hover:bg-amber-50"
                    >
                      <Edit :size="14" />
                    </button>
                    <button
                      type="button"
                      @click="deleteCategory(cat.id)"
                      class="rounded-lg border border-rose-200 bg-rose-50 p-1.5 text-rose-600 hover:bg-rose-100"
                    >
                      <Trash2 :size="14" />
                    </button>
                  </div>
                </td>
              </tr>
              <tr v-if="filteredCategories.length === 0">
                <td colspan="5" class="px-6 py-8 text-center text-sm text-slate-400">
                  No categories found matching your query.
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
      <div class="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
        <div class="mb-5 flex items-center justify-between border-b border-slate-200 pb-4">
          <h3 class="text-lg font-bold text-slate-900">
            {{ editingCategory ? "Edit Category" : "Add New Category" }}
          </h3>
          <button @click="closeModal" class="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700">
            <X :size="18" />
          </button>
        </div>

        <form @submit.prevent="saveCategory" class="space-y-4">
          <div>
            <label class="mb-1 block text-xs font-semibold text-slate-700">Category Name *</label>
            <input
              v-model="form.name"
              type="text"
              required
              placeholder="e.g. Electronic Music & Festivals"
              class="w-full rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 outline-none focus:bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
            />
          </div>

          <div>
            <label class="mb-1 block text-xs font-semibold text-slate-700">Description</label>
            <textarea
              v-model="form.description"
              rows="3"
              placeholder="Brief summary of events included in this category..."
              class="w-full rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 outline-none focus:bg-white focus:border-amber-500"
            />
          </div>

          <div>
            <label class="mb-1 block text-xs font-semibold text-slate-700">Status</label>
            <select
              v-model="form.status"
              class="w-full rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 outline-none focus:bg-white focus:border-amber-500"
            >
              <option value="active">Active (Visible on platform)</option>
              <option value="inactive">Inactive (Hidden)</option>
            </select>
          </div>

          <div class="mt-6 flex justify-end gap-3 pt-2">
            <button
              type="button"
              @click="closeModal"
              class="rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              :disabled="isSaving"
              class="rounded-lg bg-amber-500 px-5 py-2 text-xs font-semibold text-slate-950 shadow-sm transition-all hover:bg-amber-600 disabled:opacity-50"
            >
              {{ isSaving ? "Saving..." : (editingCategory ? "Save Changes" : "Create Category") }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </main>
</template>
