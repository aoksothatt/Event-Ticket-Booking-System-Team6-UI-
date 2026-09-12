<script setup>
import { ref, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import { adminApi } from "@/api/admin.js";
import { coverImage } from "../../utils/event.js";
import {
  Search,
  Plus,
  Calendar,
  Ticket,
  MapPin,
  CalendarCheck,
  Flame,
  Star,
  ArrowUpRight,
  Eye,
  Edit,
  Trash2,
  X,
  Layers,
  Building2,
  Upload,
} from "lucide-vue-next";

const router = useRouter();
const { t } = useI18n();

const loading = ref(true);
const error = ref(null);
const events = ref([]);

const categoriesList = ref([]);
const organizersList = ref([]);
const venuesList = ref([]);

const searchQuery = ref("");
const selectedCategory = ref("All");
const selectedStatus = ref("All");

const statuses = ["All", "published", "draft", "cancelled"];
const statusDisplayMap = { All: t("all"), published: t("published"), draft: t("draft"), cancelled: t("cancelled") };

const statusStyle = {
  published: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-400 dark:border-emerald-500/30",
  draft: "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-500/15 dark:text-sky-400 dark:border-sky-500/30",
  cancelled: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/15 dark:text-rose-400 dark:border-rose-500/30",
};

const categories = computed(() => {
  const set = new Set(events.value.map((e) => e.category?.name).filter(Boolean));
  return ["All", ...set];
});

const stats = computed(() => {
  const total = events.value.length;
  const published = events.value.filter((e) => e.status === "published").length;
  const draft = events.value.filter((e) => e.status === "draft").length;
  return [
    {
      label: t("totalEvents"),
      value: String(total),
      change: `${published} ${t("published").toLowerCase()}`,
      trend: "up",
      icon: Calendar,
      color: "bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400",
    },
    {
      label: t("published"),
      value: String(published),
      change: total ? `${Math.round((published / total) * 100)}% ${t("ofAllEvents")}` : "0%",
      trend: "up",
      icon: Flame,
      color: "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400",
    },
    {
      label: t("draft"),
      value: String(draft),
      change: `${draft} ${t("pendingReviewCount")}`,
      trend: "up",
      icon: Ticket,
      color: "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400",
    },
  ];
});

const filteredEvents = computed(() => {
  return events.value.filter((event) => {
    const q = searchQuery.value.toLowerCase();
    const matchesSearch =
      event.title?.toLowerCase().includes(q) ||
      event.category?.name?.toLowerCase().includes(q) ||
      event.organizer?.company_name?.toLowerCase().includes(q) ||
      event.venue?.name?.toLowerCase().includes(q);

    const matchesCategory =
      selectedCategory.value === "All" || event.category?.name === selectedCategory.value;

    const matchesStatus =
      selectedStatus.value === "All" || event.status === selectedStatus.value;

    return matchesSearch && matchesCategory && matchesStatus;
  });
});

async function fetchEvents() {
  loading.value = true;
  error.value = null;
  try {
    const res = await adminApi.getEvents();
    events.value = res.data?.data || [];
  } catch (e) {
    error.value = e.response?.data?.message || e.message || t("failed");
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  fetchEvents();
  fetchFormOptions();
});

async function fetchFormOptions() {
  try {
    const [catRes, orgRes, venRes] = await Promise.all([
      adminApi.getCategories(),
      adminApi.getOrganizers(),
      adminApi.getVenues(),
    ]);
    categoriesList.value = catRes?.data || catRes?.data?.data || catRes || [];
    organizersList.value = orgRes?.data?.data || orgRes?.data || [];
    const venPayload = venRes?.data;
    venuesList.value = Array.isArray(venPayload) ? venPayload : (venPayload?.data || []);
  } catch (e) {
    console.error("Failed to load form options:", e);
  }
}

function viewEvent(id) {
  router.push(`/admin/events/${id}`);
}

// Create/Edit Modal State
const isModalOpen = ref(false);
const editingEvent = ref(null);
const form = ref({
  title: "",
  slug: "",
  organizer_id: "",
  category_id: "",
  venue_id: "",
  start_date: "",
  end_date: "",
  start_time: "",
  end_time: "",
  status: "published",
  description: "",
  banner: null,
});
const bannerPreview = ref("");
const formError = ref("");

function openCreateModal() {
  editingEvent.value = null;
  form.value = {
    title: "",
    slug: "",
    organizer_id: "",
    category_id: "",
    venue_id: "",
    start_date: "",
    end_date: "",
    start_time: "19:00",
    end_time: "23:00",
    status: "published",
    description: "",
    banner: null,
  };
  bannerPreview.value = "";
  formError.value = "";
  isModalOpen.value = true;
}

function openEditModal(ev) {
  editingEvent.value = ev;
  form.value = {
    title: ev.title || "",
    slug: ev.slug || "",
    organizer_id: ev.organizer?.id || "",
    category_id: ev.category?.id || "",
    venue_id: ev.venue?.id || "",
    start_date: ev.start_date || "",
    end_date: ev.end_date || "",
    start_time: ev.start_time || "",
    end_time: ev.end_time || "",
    status: ev.status || "published",
    description: ev.description || "",
    banner: null,
  };
  bannerPreview.value = ev.banner || "";
  formError.value = "";
  isModalOpen.value = true;
}

function onBannerSelected(event) {
  const file = event.target.files?.[0];
  if (file) {
    form.value.banner = file;
    bannerPreview.value = URL.createObjectURL(file);
  }
}

async function saveEvent() {
  if (!form.value.title.trim()) return;
  formError.value = "";

  const fd = new FormData();
  fd.append("title", form.value.title);

  let slug = form.value.slug;
  if (!slug && form.value.title) {
    slug = form.value.title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .trim()
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-+|-+$/g, "");
  }
  if (!slug) {
    slug = "event-" + Date.now();
  }
  fd.append("slug", slug);
  fd.append("organizer_id", form.value.organizer_id);
  fd.append("category_id", form.value.category_id);
  fd.append("venue_id", form.value.venue_id);
  fd.append("start_date", form.value.start_date);
  fd.append("end_date", form.value.end_date);
  fd.append("start_time", form.value.start_time || "");
  fd.append("end_time", form.value.end_time || "");
  fd.append("status", form.value.status);
  fd.append("description", form.value.description || "");
  if (form.value.banner) {
    fd.append("banner", form.value.banner);
  }

  try {
    if (editingEvent.value) {
      const res = await adminApi.updateEvent(editingEvent.value.id, fd);
      const updated = res.data?.data || res.data;
      const idx = events.value.findIndex((e) => e.id === editingEvent.value.id);
      if (idx !== -1) {
        events.value[idx] = { ...events.value[idx], ...updated };
      }
    } else {
      const res = await adminApi.createEvent(fd);
      const created = res.data?.data || res.data;
      events.value.unshift(created);
    }
    isModalOpen.value = false;
    fetchEvents();
  } catch (e) {
    formError.value = e.response?.data?.message || e.message || t("errorMessage");
  }
}

async function deleteEvent(id) {
  if (!confirm(t("deleteConfirm"))) return;
  try {
    await adminApi.deleteEvent(id);
    events.value = events.value.filter((e) => e.id !== id);
  } catch (e) {
    alert(e.response?.data?.message || e.message || t("errorMessage"));
  }
}

// ── Trending toggle ─────────────────────────────────────────────────────────
const trendingBusy = ref(new Set());
const toast = ref("");
let toastTimer = null;

function showToast(message) {
  toast.value = message;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast.value = "";
  }, 2600);
}

async function toggleTrending(event) {
  const id = event.id;
  const next = !Boolean(event.is_trending);
  const prev = Boolean(event.is_trending);

  event.is_trending = next;
  trendingBusy.value = new Set(trendingBusy.value).add(id);

  try {
    const res = await adminApi.setEventTrending(id, next);
    const updated = res?.data || res;
    const idx = events.value.findIndex((e) => e.id === id);
    if (idx !== -1 && updated) {
      events.value[idx] = { ...events.value[idx], ...updated };
    }
    showToast(next ? t("addToTrending") : t("removeFromTrending"));
  } catch (e) {
    event.is_trending = prev;
    alert(e.response?.data?.message || e.message || t("errorMessage"));
  } finally {
    const s = new Set(trendingBusy.value);
    s.delete(id);
    trendingBusy.value = s;
  }
}
</script>

<template>
  <main class="min-h-screen flex-1 bg-slate-50 px-8 py-8 text-slate-800 dark:bg-slate-900 dark:text-white">
    <!-- Header -->
    <div class="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <div class="flex items-center gap-2.5">
          <h1 class="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">{{ t("eventsManagement") }}</h1>
          <span class="rounded-md bg-amber-100 border border-amber-200 px-2.5 py-0.5 text-xs text-amber-800 font-mono font-medium dark:bg-amber-500/15 dark:border-amber-500/30 dark:text-amber-400">
            manage_events
          </span>
        </div>
        <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">{{ t("eventsManagement") }}</p>
      </div>
      <div class="flex items-center gap-3">
        <button
          type="button"
          @click="openCreateModal"
          class="flex items-center gap-2 rounded-lg bg-amber-500 px-4 py-2.5 text-sm font-semibold text-slate-950 shadow-sm transition-all hover:bg-amber-600 hover:shadow"
        >
          <Plus :size="16" :stroke-width="2.5" />
          {{ t("createEvent") }}
        </button>
      </div>
    </div>

    <!-- Trending confirmation toast -->
    <transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="translate-y-1 opacity-0"
      enter-to-class="translate-y-0 opacity-100"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="translate-y-1 opacity-0"
    >
      <div
        v-if="toast"
        class="fixed right-4 top-4 z-[60] flex items-center gap-2 rounded-lg border border-amber-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 shadow-lg dark:border-amber-500/30 dark:bg-slate-800 dark:text-white"
        role="status"
        aria-live="polite"
      >
        <Star :size="15" class="text-amber-500" :fill="'currentColor'" />
        {{ toast }}
      </div>
    </transition>

    <!-- Loading State -->
    <div v-if="loading" class="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
      <div v-for="n in 3" :key="n" class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm animate-pulse dark:border-slate-700 dark:bg-slate-800">
        <div class="h-3 w-24 rounded bg-slate-200 mb-4 dark:bg-slate-600"></div>
        <div class="h-7 w-16 rounded bg-slate-200 mb-2 dark:bg-slate-600"></div>
        <div class="h-3 w-32 rounded bg-slate-100 dark:bg-slate-700"></div>
      </div>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="mb-8 rounded-xl border border-rose-200 bg-rose-50 p-6 text-center dark:border-red-500/30 dark:bg-red-500/10">
      <p class="text-sm font-semibold text-rose-700 dark:text-rose-400">{{ error }}</p>
      <button @click="fetchEvents" class="mt-3 text-xs font-semibold text-rose-600 underline hover:text-rose-800 dark:text-rose-400 dark:hover:text-rose-300">{{ t("retry") }}</button>
    </div>

    <!-- Stat cards -->
    <div v-else class="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
      <div
        v-for="stat in stats"
        :key="stat.label"
        class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800"
      >
        <div class="mb-4 flex items-start justify-between">
          <p class="text-xs font-semibold text-slate-500 uppercase tracking-wider dark:text-slate-400">{{ stat.label }}</p>
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
    <div class="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800">
      <div class="relative min-w-[260px] flex-1">
        <Search :size="16" class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
        <input
          v-model="searchQuery"
          type="text"
          :placeholder="t('searchPlaceholder')"
          class="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm text-slate-800 placeholder:text-slate-400 outline-none shadow-sm transition-all focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder-slate-500"
        />
      </div>

      <div class="flex flex-wrap items-center gap-3">
        <!-- Category Filter -->
        <div class="flex items-center gap-2">
          <label class="text-xs font-semibold text-slate-500 dark:text-slate-400">{{ t("eventCategory") }}</label>
          <select
            v-model="selectedCategory"
            class="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 outline-none shadow-sm focus:border-amber-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
          >
            <option v-for="cat in categories" :key="cat" :value="cat">{{ cat === 'All' ? t('all') : cat }}</option>
          </select>
        </div>

        <!-- Status Filter -->
        <div class="flex items-center gap-2">
          <label class="text-xs font-semibold text-slate-500 dark:text-slate-400">{{ t("eventStatus") }}</label>
          <select
            v-model="selectedStatus"
            class="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 outline-none shadow-sm focus:border-amber-500 capitalize dark:border-slate-700 dark:bg-slate-800 dark:text-white"
          >
            <option v-for="st in statuses" :key="st" :value="st">{{ statusDisplayMap[st] || st }}</option>
          </select>
        </div>
      </div>
    </div>

    <!-- Events Table -->
    <div class="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
      <div class="flex items-center justify-between border-b border-slate-200 px-6 py-4 dark:border-slate-700">
        <h2 class="text-base font-bold text-slate-900 dark:text-white">{{ t('events') }} ({{ filteredEvents.length }})</h2>
      </div>

      <!-- Table Loading Skeleton -->
      <div v-if="loading" class="divide-y divide-slate-100 dark:divide-slate-700">
        <div v-for="n in 5" :key="n" class="flex items-center gap-6 px-6 py-4 animate-pulse">
          <div class="h-4 w-48 rounded bg-slate-200 dark:bg-slate-600"></div>
          <div class="h-4 w-28 rounded bg-slate-200 dark:bg-slate-600"></div>
          <div class="h-4 w-32 rounded bg-slate-200 dark:bg-slate-600"></div>
          <div class="h-4 w-20 rounded bg-slate-200 dark:bg-slate-600"></div>
        </div>
      </div>

      <div v-else class="overflow-x-auto">
        <table class="w-full text-left text-sm">
          <thead class="bg-slate-50/70 border-b border-slate-200 dark:bg-slate-700/50 dark:border-slate-700">
            <tr class="text-[11px] font-bold text-slate-500 uppercase tracking-wider dark:text-slate-400">
              <th class="px-6 py-3">{{ t("eventHeader") }}</th>
              <th class="px-6 py-3">{{ t("datesTiming") }}</th>
              <th class="px-6 py-3">{{ t("venueLocation") }}</th>
              <th class="px-6 py-3">{{ t("status") }}</th>
              <th class="px-6 py-3">{{ t("trendingHeader") }}</th>
              <th class="px-6 py-3 text-right">{{ t("actions") }}</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 dark:divide-slate-700">
            <tr
              v-for="event in filteredEvents"
              :key="event.id"
              class="transition-colors hover:bg-slate-50/80 dark:hover:bg-slate-700/50"
            >
              <td class="px-6 py-4">
                <div class="flex items-center gap-3">
                  <div class="h-12 w-16 shrink-0 overflow-hidden rounded-md bg-slate-100 dark:bg-slate-700">
                    <img
                      v-if="coverImage(event)"
                      :src="coverImage(event)"
                      :alt="event.title"
                      class="h-full w-full object-cover"
                    />
                    <span v-else class="flex h-full w-full items-center justify-center">
                      <Calendar :size="16" class="text-slate-300 dark:text-slate-600" />
                    </span>
                  </div>
                  <div class="min-w-0">
                    <p class="font-semibold text-slate-900 dark:text-white">{{ event.title }}</p>
                    <div class="mt-1 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                      <span class="rounded bg-slate-100 border border-slate-200 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700 dark:bg-slate-700 dark:border-slate-600 dark:text-amber-400">{{ event.category?.name || t('na') }}</span>
                      <span class="truncate">{{ t("by") }} {{ event.organizer?.company_name || t("na") }}</span>
                    </div>
                  </div>
                </div>
              </td>
              <td class="px-6 py-4 text-slate-700 dark:text-slate-300">
                <div class="text-sm font-semibold text-slate-900 dark:text-white">{{ event.start_date }}</div>
                <div class="text-xs text-slate-400 dark:text-slate-500">{{ event.start_time }} - {{ event.end_time }}</div>
                <div class="text-xs text-slate-500 dark:text-slate-400">{{ t("ends") }} {{ event.end_date }}</div>
              </td>
              <td class="px-6 py-4 text-slate-700 dark:text-slate-300">
                <div class="flex items-center gap-1.5 text-xs font-medium">
                  <MapPin :size="13" class="text-amber-600" />
                  {{ event.venue?.name || t('na') }}
                </div>
              </td>
              <td class="px-6 py-4">
                <span
                  class="rounded-full border px-2.5 py-0.5 text-[11px] font-semibold capitalize"
                  :class="statusStyle[event.status]"
                >
                  {{ statusDisplayMap[event.status] || event.status }}
                </span>
              </td>
              <td class="px-6 py-4">
                <div
                  class="flex items-center gap-2"
                  :class="trendingBusy.has(event.id) ? 'opacity-60 pointer-events-none' : ''"
                >
                  <button
                    type="button"
                    role="switch"
                    :aria-checked="Boolean(event.is_trending)"
                    :aria-label="`${event.is_trending ? t('removeFromTrending') : t('addToTrending')} ${event.title}`"
                    :title="event.is_trending ? t('removeFromTrending') : t('addToTrending')"
                    class="relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors disabled:cursor-wait"
                    :class="event.is_trending ? 'bg-amber-500' : 'bg-slate-300 dark:bg-slate-600'"
                    :disabled="trendingBusy.has(event.id)"
                    @click="toggleTrending(event)"
                  >
                    <span
                      class="inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform"
                      :class="event.is_trending ? 'translate-x-6' : 'translate-x-0.5'"
                    ></span>
                  </button>
                  <span
                    class="flex items-center gap-1 text-xs font-semibold"
                    :class="event.is_trending ? 'text-amber-600' : 'text-slate-400 dark:text-slate-500'"
                  >
                    <Star :size="14" :fill="event.is_trending ? 'currentColor' : 'none'" />
                    {{ event.is_trending ? t("toggleOn") : t("toggleOff") }}
                  </span>
                </div>
              </td>
              <td class="px-6 py-4 text-right">
                <div class="flex items-center justify-end gap-1.5">
                  <button
                    type="button"
                    @click="viewEvent(event.id)"
                    class="rounded-lg border border-slate-200 bg-slate-50 p-1.5 text-slate-600 hover:border-amber-500 hover:text-amber-700 hover:bg-amber-50 dark:border-slate-700 dark:bg-slate-700 dark:text-slate-400 dark:hover:bg-amber-500/10"
                    :title="t('viewDetails')"
                  >
                    <Eye :size="14" />
                  </button>
                  <button
                    type="button"
                    @click="openEditModal(event)"
                    class="rounded-lg border border-slate-200 bg-slate-50 p-1.5 text-slate-600 hover:border-amber-500 hover:text-amber-700 hover:bg-amber-50 dark:border-slate-700 dark:bg-slate-700 dark:text-slate-400 dark:hover:bg-amber-500/10"
                    :title="t('editEvent')"
                  >
                    <Edit :size="14" />
                  </button>
                  <button
                    type="button"
                    @click="deleteEvent(event.id)"
                      class="rounded-lg border border-rose-200 bg-rose-50 p-1.5 text-rose-600 hover:bg-rose-100 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-400 dark:hover:bg-red-500/20"
                      :title="t('delete')"
                  >
                    <Trash2 :size="14" />
                  </button>
                </div>
              </td>
            </tr>
            <tr v-if="filteredEvents.length === 0">
              <td colspan="6" class="px-6 py-8 text-center text-sm text-slate-400 dark:text-slate-500">
                {{ t("noEventsFound") }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Create / Edit Event Modal -->
    <div
      v-if="isModalOpen"
      class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm"
    >
      <div class="w-full max-w-xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl max-h-[90vh] overflow-y-auto dark:border-slate-700 dark:bg-slate-800">
        <div class="mb-5 flex items-center justify-between border-b border-slate-200 pb-4 dark:border-slate-700">
          <h3 class="text-lg font-bold text-slate-900 dark:text-white">
            {{ editingEvent ? t("editEvent") : t("createNewEvent") }}
          </h3>
          <button @click="isModalOpen = false" class="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:text-slate-500 dark:hover:bg-slate-700 dark:hover:text-white">
            <X :size="18" />
          </button>
        </div>

        <form @submit.prevent="saveEvent" class="space-y-4">
          <div>
            <label class="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">{{ t("eventTitle") }} *</label>
            <input
              v-model="form.title"
              type="text"
              required
              :placeholder="t('eventTitlePlaceholder')"
              class="w-full rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2 text-sm text-slate-900 outline-none focus:bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 dark:border-slate-700 dark:bg-slate-700 dark:text-white dark:focus:bg-slate-800"
            />
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">{{ t("categoryName") }} *</label>
              <select
                v-model="form.category_id"
                required
                class="w-full rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2 text-sm text-slate-900 outline-none focus:bg-white focus:border-amber-500 dark:border-slate-700 dark:bg-slate-700 dark:text-white dark:focus:bg-slate-800"
              >
                <option value="" disabled>{{ t("selectCategory") }}</option>
                <option v-for="c in categoriesList" :key="c.id" :value="c.id">{{ c.name }}</option>
              </select>
            </div>
            <div>
              <label class="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">{{ t("organizerHeader") }} *</label>
              <select
                v-model="form.organizer_id"
                required
                class="w-full rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2 text-sm text-slate-900 outline-none focus:bg-white focus:border-amber-500 dark:border-slate-700 dark:bg-slate-700 dark:text-white dark:focus:bg-slate-800"
              >
                <option value="" disabled>{{ t("selectOrganizer") }}</option>
                <option v-for="o in organizersList" :key="o.id" :value="o.id">
                  {{ o.user?.name || o.company_name || `#${o.id}` }}
                </option>
              </select>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">{{ t("venues") }} *</label>
              <select
                v-model="form.venue_id"
                required
                class="w-full rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2 text-sm text-slate-900 outline-none focus:bg-white focus:border-amber-500 dark:border-slate-700 dark:bg-slate-700 dark:text-white dark:focus:bg-slate-800"
              >
                <option value="" disabled>{{ t("selectVenue") }}</option>
                <option v-for="v in venuesList" :key="v.id" :value="v.id">{{ v.name }}</option>
              </select>
            </div>
            <div>
              <label class="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">{{ t("status") }}</label>
              <select
                v-model="form.status"
                class="w-full rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2 text-sm text-slate-900 outline-none focus:bg-white focus:border-amber-500 capitalize dark:border-slate-700 dark:bg-slate-700 dark:text-white dark:focus:bg-slate-800"
              >
                <option value="published">{{ t("published") }}</option>
                <option value="draft">{{ t("draft") }}</option>
                <option value="cancelled">{{ t("cancelled") }}</option>
              </select>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">{{ t("startDate") }} *</label>
              <input
                v-model="form.start_date"
                type="date"
                required
                class="w-full rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2 text-sm text-slate-900 outline-none focus:bg-white focus:border-amber-500 dark:border-slate-700 dark:bg-slate-700 dark:text-white dark:focus:bg-slate-800"
              />
            </div>
            <div>
              <label class="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">{{ t("endDate") }} *</label>
              <input
                v-model="form.end_date"
                type="date"
                required
                class="w-full rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2 text-sm text-slate-900 outline-none focus:bg-white focus:border-amber-500 dark:border-slate-700 dark:bg-slate-700 dark:text-white dark:focus:bg-slate-800"
              />
            </div>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">{{ t("startTime") }}</label>
              <input
                v-model="form.start_time"
                type="time"
                class="w-full rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2 text-sm text-slate-900 outline-none focus:bg-white focus:border-amber-500 dark:border-slate-700 dark:bg-slate-700 dark:text-white dark:focus:bg-slate-800"
              />
            </div>
            <div>
              <label class="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">{{ t("endTime") }}</label>
              <input
                v-model="form.end_time"
                type="time"
                class="w-full rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2 text-sm text-slate-900 outline-none focus:bg-white focus:border-amber-500 dark:border-slate-700 dark:bg-slate-700 dark:text-white dark:focus:bg-slate-800"
              />
            </div>
          </div>

          <div>
            <label class="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">{{ t("bannerImage") }}</label>
            <div class="flex items-center gap-4">
              <label
                class="flex cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 px-6 py-4 text-center text-slate-500 transition-colors hover:border-amber-500 hover:bg-amber-50 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-400 dark:hover:bg-amber-500/10"
              >
                <Upload :size="20" />
                <span class="text-xs font-medium">{{ t("uploadBanner") }}</span>
                <input
                  type="file"
                  accept="image/*"
                  class="hidden"
                  @change="onBannerSelected"
                />
              </label>
              <img
                v-if="bannerPreview"
                :src="bannerPreview"
                :alt="t('bannerImage')"
                class="h-20 w-40 rounded-lg border border-slate-200 object-cover dark:border-slate-700"
              />
            </div>
          </div>

          <div>
            <label class="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">{{ t("description") }}</label>
            <textarea
              v-model="form.description"
              rows="3"
              class="w-full rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2 text-sm text-slate-900 outline-none focus:bg-white focus:border-amber-500 dark:border-slate-700 dark:bg-slate-700 dark:text-white dark:focus:bg-slate-800"
            />
          </div>

          <div v-if="formError" class="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-400">
            {{ formError }}
          </div>

          <div class="mt-6 flex justify-end gap-3 pt-2">
            <button
              type="button"
              @click="isModalOpen = false"
              class="rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-700"
            >
              {{ t("cancel") }}
            </button>
            <button
              type="submit"
              class="rounded-lg bg-amber-500 px-5 py-2 text-xs font-semibold text-slate-950 shadow-sm transition-all hover:bg-amber-600"
            >
              {{ editingEvent ? t("saveChanges") : t("createEvent") }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </main>
</template>
