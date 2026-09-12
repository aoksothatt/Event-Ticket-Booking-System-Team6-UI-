<script setup>
import { ref, computed, onMounted } from "vue";
import { adminApi } from "@/api/admin.js";
import {
  MapPin,
  Search,
  Plus,
  Building,
  Users,
  Edit,
  Trash2,
  CheckCircle2,
  ArrowUpRight,
  X,
  Globe,
  Navigation,
} from "lucide-vue-next";
import { useI18n } from "vue-i18n";
const { t } = useI18n();

function venueStatusLabel(s) {
  return s ? t(s) : t('na');
}

const venues = ref([]);
const isLoading = ref(true);
const error = ref(null);

const searchQuery = ref("");
const selectedStatus = ref("All");
const selectedCity = ref("All");

const stats = computed(() => {
  const total = venues.value.length;
  const active = venues.value.filter((v) => v.status === "active").length;
  const totalCapacity = venues.value.reduce((sum, v) => sum + (Number(v.capacity) || 0), 0);
  return [
    { label: t('totalVenues'), value: total, change: t('activeCount', { count: active }), icon: MapPin, color: "bg-emerald-50 text-emerald-600" },
    { label: t('totalPlatformCapacity'), value: totalCapacity.toLocaleString(), change: t('acrossRegisteredLocations'), icon: Users, color: "bg-blue-50 text-blue-600" },
    { label: t('activeVenues'), value: active, change: t('percentCurrentlyAvailable', { pct: total ? Math.round((active / total) * 100) : 0 }), icon: CheckCircle2, color: "bg-amber-50 text-amber-600" },
  ];
});

const cities = computed(() => {
  const set = new Set(venues.value.map((v) => v.city).filter(Boolean));
  return ["All", ...Array.from(set).sort()];
});

async function fetchVenues() {
  isLoading.value = true;
  error.value = null;
  try {
    const response = await adminApi.getVenues();
    const payload = response.data;
    venues.value = Array.isArray(payload) ? payload : (payload.data || []);
  } catch (err) {
    error.value = err.response?.data?.message || err.message || t('failedToLoadVenues');
  } finally {
    isLoading.value = false;
  }
}

onMounted(fetchVenues);

const statusStyle = {
  active: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-400 dark:border-emerald-500/30",
  inactive: "bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700",
};

const filteredVenues = computed(() => {
  return venues.value.filter((v) => {
    const matchesSearch =
      v.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      (v.city || "").toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      (v.address || "").toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      (v.country || "").toLowerCase().includes(searchQuery.value.toLowerCase());

    const matchesStatus =
      selectedStatus.value === "All" || v.status === selectedStatus.value;

    const matchesCity =
      selectedCity.value === "All" || v.city === selectedCity.value;

    return matchesSearch && matchesStatus && matchesCity;
  });
});

// Modal state
const isModalOpen = ref(false);
const editingVenue = ref(null);
const isSaving = ref(false);
const form = ref({
  name: "",
  address: "",
  city: "",
  province: "",
  country: "United States",
  capacity: 500,
  description: "",
  status: "active",
});

function openCreateModal() {
  editingVenue.value = null;
  form.value = {
    name: "",
    address: "",
    city: "",
    province: "",
    country: "United States",
    capacity: 500,
    description: "",
    status: "active",
  };
  isModalOpen.value = true;
}

function openEditModal(venue) {
  editingVenue.value = venue;
  form.value = { ...venue };
  isModalOpen.value = true;
}

function closeModal() {
  isModalOpen.value = false;
  editingVenue.value = null;
}

async function saveVenue() {
  if (!form.value.name.trim() || !form.value.city.trim()) return;
  isSaving.value = true;
  try {
    const payload = {
      name: form.value.name,
      address: form.value.address,
      city: form.value.city,
      province: form.value.province,
      country: form.value.country,
      capacity: Number(form.value.capacity),
      description: form.value.description,
      status: form.value.status,
    };
    if (editingVenue.value) {
      await adminApi.updateVenue(editingVenue.value.id, payload);
    } else {
      await adminApi.createVenue(payload);
    }
    await fetchVenues();
    closeModal();
  } catch (err) {
    alert(err.response?.data?.message || err.message || t('failedToSaveVenue'));
  } finally {
    isSaving.value = false;
  }
}

async function deleteVenue(id) {
  if (confirm(t('confirmDeleteVenue'))) {
    try {
      await adminApi.deleteVenue(id);
      await fetchVenues();
    } catch (err) {
      alert(err.response?.data?.message || err.message || t('failedToDeleteVenue'));
    }
  }
}
</script>

<template>
  <main class="min-h-screen flex-1 bg-slate-50 dark:bg-slate-900 px-8 py-8 text-slate-800 dark:text-slate-100">
    <!-- Header -->
    <div class="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <div class="flex items-center gap-2.5">
          <h1 class="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">{{ t('venuesManagement') }}</h1>
          <span class="rounded-md bg-emerald-100 border border-emerald-200 px-2.5 py-0.5 text-xs text-emerald-800 font-mono font-medium dark:bg-emerald-500/15 dark:border-emerald-500/30 dark:text-emerald-400">
            manage_venues
          </span>
        </div>
        <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">{{ t('venuesDesc') }}</p>
      </div>
      <div class="flex items-center gap-3">
        <button
          type="button"
          @click="openCreateModal"
          class="flex items-center gap-2 rounded-lg bg-amber-500 px-4 py-2.5 text-sm font-semibold text-slate-950 shadow-sm transition-all hover:bg-amber-600 hover:shadow"
        >
          <Plus :size="16" :stroke-width="2.5" />
          {{ t('addVenue') }}
        </button>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" class="mb-8 flex items-center justify-center py-12">
      <div class="flex items-center gap-3 text-slate-500 dark:text-slate-400">
        <svg class="h-5 w-5 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
        </svg>
        <span class="text-sm font-medium">{{ t('loadingVenues') }}</span>
      </div>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="mb-8 rounded-xl border border-rose-200 bg-rose-50 p-6 text-center dark:border-rose-500/30 dark:bg-rose-500/10">
      <p class="text-sm font-semibold text-rose-700 dark:text-rose-400">{{ error }}</p>
      <button @click="fetchVenues" class="mt-3 rounded-lg bg-rose-100 px-4 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-200 dark:bg-rose-500/15 dark:text-rose-400 dark:hover:bg-rose-500/25">
        {{ t('retry') }}
      </button>
    </div>

    <template v-else>
      <!-- Stat cards -->
      <div class="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div
          v-for="stat in stats"
          :key="stat.label"
          class="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 shadow-sm"
        >
          <div class="mb-4 flex items-start justify-between">
            <p class="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{{ stat.label }}</p>
            <span class="flex h-8 w-8 items-center justify-center rounded-lg shadow-sm" :class="stat.color">
              <component :is="stat.icon" :size="16" />
            </span>
          </div>
          <p class="text-2xl font-bold text-slate-900 dark:text-white">{{ stat.value }}</p>
          <p class="mt-2 flex items-center gap-1 text-xs font-medium text-emerald-600">
            <ArrowUpRight :size="14" />
            {{ stat.change }}
          </p>
        </div>
      </div>

      <!-- Filter & Search Bar -->
      <div class="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 shadow-sm">
        <div class="relative min-w-[260px] flex-1">
          <Search :size="16" class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
          <input
            v-model="searchQuery"
            type="text"
            :placeholder="t('searchVenuesPlaceholder')"
            class="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 py-2 pl-9 pr-3 text-sm text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none shadow-sm transition-all focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
          />
        </div>

        <div class="flex flex-wrap items-center gap-3">
          <!-- City Filter -->
          <div class="flex items-center gap-2">
            <label class="text-xs font-semibold text-slate-500 dark:text-slate-400">{{ t('venueCity') }}:</label>
            <select
              v-model="selectedCity"
              class="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs text-slate-800 dark:text-slate-100 outline-none shadow-sm focus:border-amber-500"
            >
              <option v-for="c in cities" :key="c" :value="c">{{ c }}</option>
            </select>
          </div>

          <!-- Status Filter -->
          <div class="flex items-center gap-2">
            <label class="text-xs font-semibold text-slate-500 dark:text-slate-400">{{ t('eventStatus') }}</label>
            <select
              v-model="selectedStatus"
              class="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs text-slate-800 dark:text-slate-100 outline-none shadow-sm focus:border-amber-500 capitalize"
            >
              <option value="All">{{ t('allStatuses') }}</option>
              <option value="active">{{ t('active') }}</option>
              <option value="inactive">{{ t('inactive') }}</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Venues Table -->
      <div class="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm">
        <div class="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 px-6 py-4">
          <h2 class="text-base font-bold text-slate-900 dark:text-white">{{ t('registeredVenuesCount', { count: filteredVenues.length }) }}</h2>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full text-left text-sm">
            <thead class="bg-slate-50/70 dark:bg-slate-700/50 border-b border-slate-200 dark:border-slate-700">
              <tr class="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                <th class="px-6 py-3">{{ t('venueName') }}</th>
                <th class="px-6 py-3">{{ t('locationAddress') }}</th>
                <th class="px-6 py-3">{{ t('maxCapacity') }}</th>
                <th class="px-6 py-3">{{ t('status') }}</th>
                <th class="px-6 py-3 text-right">{{ t('actions') }}</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 dark:divide-slate-700">
              <tr
                v-for="venue in filteredVenues"
                :key="venue.id"
                class="transition-colors hover:bg-slate-50/80 dark:hover:bg-slate-700/50"
              >
                <td class="px-6 py-4">
                  <div class="flex items-center gap-3">
                    <div class="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 shadow-sm">
                      <MapPin :size="18" />
                    </div>
                    <div>
                      <p class="font-semibold text-slate-900 dark:text-white">{{ venue.name }}</p>
                      <p class="text-xs text-slate-500 dark:text-slate-400 line-clamp-1 max-w-xs">{{ venue.description }}</p>
                    </div>
                  </div>
                </td>
                <td class="px-6 py-4">
                  <p class="text-xs font-semibold text-slate-900 dark:text-white">{{ venue.address }}</p>
                  <p class="text-[11px] text-slate-400 dark:text-slate-500">
                    {{ venue.city }}{{ venue.province ? `, ${venue.province}` : '' }}, {{ venue.country }}
                  </p>
                </td>
                <td class="px-6 py-4 font-mono text-xs font-bold text-slate-900 dark:text-white">
                  {{ Number(venue.capacity).toLocaleString() }} {{ t('seats') }}
                </td>
                <td class="px-6 py-4">
                  <span class="rounded-full border px-2.5 py-0.5 text-[11px] font-semibold capitalize" :class="statusStyle[venue.status]">
                    {{ venueStatusLabel(venue.status) }}
                  </span>
                </td>
                <td class="px-6 py-4 text-right">
                  <div class="flex items-center justify-end gap-1.5">
                    <button
                      type="button"
                      @click="openEditModal(venue)"
                      class="rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700 p-1.5 text-slate-600 dark:text-slate-400 hover:border-amber-500 hover:text-amber-700 hover:bg-amber-50"
                    >
                      <Edit :size="14" />
                    </button>
                    <button
                      type="button"
                      @click="deleteVenue(venue.id)"
                      class="rounded-lg border border-rose-200 bg-rose-50 p-1.5 text-rose-600 hover:bg-rose-100 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-400 dark:hover:bg-red-500/20"
                    >
                      <Trash2 :size="14" />
                    </button>
                  </div>
                </td>
              </tr>
              <tr v-if="filteredVenues.length === 0">
                <td colspan="5" class="px-6 py-8 text-center text-sm text-slate-400 dark:text-slate-500">
                  {{ t('noVenuesMatchingCriteria') }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </template>

    <!-- Create / Edit Venue Modal -->
    <div
      v-if="isModalOpen"
      class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm"
    >
      <div class="w-full max-w-lg rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 shadow-2xl">
        <div class="mb-5 flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-4">
          <h3 class="text-lg font-bold text-slate-900 dark:text-white">
            {{ editingVenue ? t('editVenueLocation') : t('addNewVenue') }}
          </h3>
          <button @click="closeModal" class="rounded-lg p-1 text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-700 dark:hover:text-slate-200">
            <X :size="18" />
          </button>
        </div>

        <form @submit.prevent="saveVenue" class="space-y-4">
          <div>
            <label class="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">{{ t('venueName') }} *</label>
            <input
              v-model="form.name"
              type="text"
              required
              :placeholder="t('venueNamePlaceholder')"
              class="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700 px-3.5 py-2 text-sm text-slate-900 dark:text-slate-100 outline-none focus:bg-white dark:focus:bg-slate-600 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
            />
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">{{ t('address') }} *</label>
              <input
                v-model="form.address"
                type="text"
                required
                :placeholder="t('streetAddressPlaceholder')"
                class="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700 px-3.5 py-2 text-sm text-slate-900 dark:text-slate-100 outline-none focus:bg-white dark:focus:bg-slate-600 focus:border-amber-500"
              />
            </div>
            <div>
              <label class="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">{{ t('venueCity') }} *</label>
              <input
                v-model="form.city"
                type="text"
                required
                :placeholder="t('venueCity')"
                class="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700 px-3.5 py-2 text-sm text-slate-900 dark:text-slate-100 outline-none focus:bg-white dark:focus:bg-slate-600 focus:border-amber-500"
              />
            </div>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">{{ t('provinceState') }}</label>
              <input
                v-model="form.province"
                type="text"
                :placeholder="t('stateOrProvincePlaceholder')"
                class="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700 px-3.5 py-2 text-sm text-slate-900 dark:text-slate-100 outline-none focus:bg-white dark:focus:bg-slate-600 focus:border-amber-500"
              />
            </div>
            <div>
              <label class="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">{{ t('venueCountry') }} *</label>
              <input
                v-model="form.country"
                type="text"
                required
                :placeholder="t('venueCountry')"
                class="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700 px-3.5 py-2 text-sm text-slate-900 dark:text-slate-100 outline-none focus:bg-white dark:focus:bg-slate-600 focus:border-amber-500"
              />
            </div>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">{{ t('maxCapacity') }} *</label>
              <input
                v-model="form.capacity"
                type="number"
                min="1"
                required
                class="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700 px-3.5 py-2 text-sm text-slate-900 dark:text-slate-100 outline-none focus:bg-white dark:focus:bg-slate-600 focus:border-amber-500"
              />
            </div>
            <div>
              <label class="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">{{ t('status') }}</label>
              <select
                v-model="form.status"
                class="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700 px-3.5 py-2 text-sm text-slate-900 dark:text-slate-100 outline-none focus:bg-white dark:focus:bg-slate-600 focus:border-amber-500 capitalize"
              >
                <option value="active">{{ t('active') }}</option>
                <option value="inactive">{{ t('inactive') }}</option>
              </select>
            </div>
          </div>

          <div>
            <label class="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">{{ t('description') }}</label>
            <textarea
              v-model="form.description"
              rows="2"
              :placeholder="t('venueDescriptionPlaceholder')"
              class="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700 px-3.5 py-2 text-sm text-slate-900 dark:text-slate-100 outline-none focus:bg-white dark:focus:bg-slate-600 focus:border-amber-500"
            />
          </div>

          <div class="mt-6 flex justify-end gap-3 pt-2">
            <button
              type="button"
              @click="closeModal"
              class="rounded-lg border border-slate-200 dark:border-slate-700 px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700"
            >
              {{ t('cancel') }}
            </button>
            <button
              type="submit"
              :disabled="isSaving"
              class="rounded-lg bg-amber-500 px-5 py-2 text-xs font-semibold text-slate-950 shadow-sm transition-all hover:bg-amber-600 disabled:opacity-50"
            >
              {{ isSaving ? t('saving') : (editingVenue ? t('saveChanges') : t('createVenue')) }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </main>
</template>
