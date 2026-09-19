<script setup>
import { ref, computed, onMounted, watch } from "vue";
import { useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import { adminApi } from "@/api/admin.js";
import { coverImage, formatDateTimeRangeParts } from "../../utils/event.js";
import {
  Search,
  Plus,
  Calendar,
  MapPin,
  Flame,
  ArrowUpRight,
  Eye,
  Edit,
  Trash2,
  X,
  Layers,
  Upload,
  ChevronLeft,
  ChevronRight,
} from "lucide-vue-next";

const router = useRouter();
const { t } = useI18n();

const loading = ref(true);
const error = ref(null);
const events = ref([]);

const categoriesList = ref([]);
const organizersList = ref([]);
const venuesList = ref([]);

// ── Server-driven filters (the backend does the actual filtering) ──────────
const activeTab = ref("all"); // all | trending | upcoming
const searchQuery = ref("");
const selectedCategory = ref("All"); // 'All' or a category id
const selectedStatus = ref("All");
const currentPage = ref(1);
const perPage = ref(10);
const lastPage = ref(1);
const total = ref(0);
const from = ref(0);
const to = ref(0);

// Lightweight totals backing the tab badges + stat cards.
const counts = ref({ all: 0, trending: 0, upcoming: 0 });

const statuses = ["All", "published", "draft", "cancelled"];
const statusDisplayMap = {
  All: t("all"),
  published: t("published"),
  draft: t("draft"),
  cancelled: t("cancelled"),
};

const statusStyle = {
  published:
    "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-400 dark:border-emerald-500/30",
  draft:
    "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-500/15 dark:text-sky-400 dark:border-sky-500/30",
  cancelled:
    "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/15 dark:text-rose-400 dark:border-rose-500/30",
};

const tabs = computed(() => [
  { key: "all", label: t("allEvents"), icon: Layers, count: counts.value.all },
  { key: "trending", label: t("trending"), icon: Flame, count: counts.value.trending },
  { key: "upcoming", label: t("upcomingHeader"), icon: Calendar, count: counts.value.upcoming },
]);

const stats = computed(() => [
  {
    label: t("totalEvents"),
    value: String(counts.value.all),
    change: t("totalEventsNote"),
    icon: Layers,
    color:
      "bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400",
  },
  {
    label: t("trending"),
    value: String(counts.value.trending),
    change: t("trendingNote"),
    icon: Flame,
    color:
      "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400",
  },
  {
    label: t("upcomingHeader"),
    value: String(counts.value.upcoming),
    change: t("upcomingAuto"),
    icon: Calendar,
    color:
      "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400",
  },
]);

async function fetchEvents() {
  loading.value = true;
  error.value = null;
  try {
    const params = { page: currentPage.value, per_page: perPage.value };
    if (activeTab.value !== "all") params.filter = activeTab.value;
    if (searchQuery.value.trim()) params.search = searchQuery.value.trim();
    if (selectedCategory.value !== "All") params.category_id = selectedCategory.value;
    if (selectedStatus.value !== "All") params.status = selectedStatus.value;

    const res = await adminApi.getEvents(params);
    const paginated = res?.data;
    events.value = paginated?.data || [];
    total.value = paginated?.total || events.value.length;
    currentPage.value = paginated?.current_page || 1;
    lastPage.value = paginated?.last_page || 1;
    from.value = paginated?.from || 0;
    to.value = paginated?.to || 0;
  } catch (e) {
    error.value = e.response?.data?.message || e.message || t("failed");
  } finally {
    loading.value = false;
  }
}

async function loadCounts() {
  try {
    const [allRes, trendRes, upcomingRes] = await Promise.all([
      adminApi.getEvents({ per_page: 1 }),
      adminApi.getEvents({ per_page: 1, filter: "trending" }),
      adminApi.getEvents({ per_page: 1, filter: "upcoming" }),
    ]);
    counts.value = {
      all: allRes?.data?.total || 0,
      trending: trendRes?.data?.total || 0,
      upcoming: upcomingRes?.data?.total || 0,
    };
  } catch (e) {
    // Counts are informational — keep whatever we had if they fail.
  }
}

function applyFilters() {
  currentPage.value = 1;
  fetchEvents();
}

function goToPage(page) {
  if (page < 1 || page > lastPage.value || page === currentPage.value) return;
  currentPage.value = page;
  fetchEvents();
}

let searchTimer = null;
watch(searchQuery, () => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => {
    applyFilters();
  }, 400);
});

watch([activeTab, selectedCategory, selectedStatus], applyFilters);

onMounted(() => {
  fetchEvents();
  loadCounts();
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
    venuesList.value = Array.isArray(venPayload)
      ? venPayload
      : venPayload?.data || [];
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
      await adminApi.updateEvent(editingEvent.value.id, fd);
    } else {
      await adminApi.createEvent(fd);
    }
    isModalOpen.value = false;
    await Promise.all([fetchEvents(), loadCounts()]);
  } catch (e) {
    formError.value =
      e.response?.data?.message || e.message || t("errorMessage");
  }
}

async function deleteEvent(id) {
  if (!confirm(t("deleteConfirm"))) return;
  try {
    await adminApi.deleteEvent(id);
    if (events.value.length === 1 && currentPage.value > 1) {
      currentPage.value -= 1;
    }
    await Promise.all([fetchEvents(), loadCounts()]);
  } catch (e) {
    alert(e.response?.data?.message || e.message || t("errorMessage"));
  }
}

// ── Trending toggle (manual admin selection; Upcoming is auto-derived) ───────
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
    await adminApi.setEventTrending(id, next);
    showToast(next ? t("addToTrending") : t("removeFromTrending"));
    await Promise.all([fetchEvents(), loadCounts()]);
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
  <main
    class="min-h-screen flex-1 bg-slate-50 px-8 py-8 text-slate-800 dark:bg-slate-900 dark:text-white"
  >
    <!-- Header -->
    <div
      class="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"
    >
      <div>
        <div class="flex items-center gap-2.5">
          <h1 class="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">{{ t("eventsManagement") }}</h1>
          <span class="rounded-md bg-primary/15 border border-primary/20 px-2.5 py-0.5 text-xs text-primary-accent font-mono font-medium dark:bg-primary/15 dark:border-primary/30 dark:text-primary-accent">
            manage_events
          </span>
        </div>
        <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">
          {{ t("eventsManagement") }}
        </p>
      </div>
      <div class="flex items-center gap-3">
        <button
          type="button"
          @click="openCreateModal"
          class="flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-contrast shadow-sm transition-all hover:bg-primary-hover hover:shadow"
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
        class="fixed right-4 top-4 z-[60] flex items-center gap-2 rounded-lg border border-primary/20 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 shadow-lg dark:border-primary/30 dark:bg-slate-800 dark:text-white"
        role="status"
        aria-live="polite"
      >
        <Flame :size="15" class="text-primary" :fill="'currentColor'" />
        {{ toast }}
      </div>
    </transition>

    <!-- Loading State -->
    <div v-if="loading" class="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
      <div
        v-for="n in 3"
        :key="n"
        class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm animate-pulse dark:border-slate-700 dark:bg-slate-800"
      >
        <div class="h-3 w-24 rounded bg-slate-200 mb-4 dark:bg-slate-600"></div>
        <div class="h-7 w-16 rounded bg-slate-200 mb-2 dark:bg-slate-600"></div>
        <div class="h-3 w-32 rounded bg-slate-100 dark:bg-slate-700"></div>
      </div>
    </div>

    <!-- Error State -->
    <div
      v-else-if="error"
      class="mb-8 rounded-xl border border-rose-200 bg-rose-50 p-6 text-center dark:border-red-500/30 dark:bg-red-500/10"
    >
      <p class="text-sm font-semibold text-rose-700 dark:text-rose-400">
        {{ error }}
      </p>
      <button
        @click="fetchEvents"
        class="mt-3 text-xs font-semibold text-rose-600 underline hover:text-rose-800 dark:text-rose-400 dark:hover:text-rose-300"
      >
        {{ t("retry") }}
      </button>
    </div>

    <!-- Stat cards -->
    <div v-else class="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
      <div
        v-for="stat in stats"
        :key="stat.label"
        class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800"
      >
        <div class="mb-4 flex items-start justify-between">
          <p
            class="text-xs font-semibold text-slate-500 uppercase tracking-wider dark:text-slate-400"
          >
            {{ stat.label }}
          </p>
          <span
            class="flex h-8 w-8 items-center justify-center rounded-lg shadow-sm"
            :class="stat.color"
          >
            <component :is="stat.icon" :size="16" />
          </span>
        </div>
        <p class="text-2xl font-bold text-slate-900 dark:text-white">
          {{ stat.value }}
        </p>
        <p
          class="mt-2 flex items-center gap-1 text-xs font-medium text-emerald-600"
        >
          <ArrowUpRight :size="14" />
          {{ stat.change }}
        </p>
      </div>
    </div>

    <!-- Segmented control: All / Trending / Upcoming -->
    <div
      role="tablist"
      aria-label="Event list filter"
      class="mb-6 flex gap-2 overflow-x-auto rounded-xl border border-slate-200 bg-white p-1.5 shadow-sm [scrollbar-width:thin] dark:border-slate-700 dark:bg-slate-800"
    >
      <button
        v-for="tab in tabs"
        :key="tab.key"
        type="button"
        role="tab"
        :aria-selected="activeTab === tab.key"
        :aria-label="`${tab.label}: ${tab.count} ${t('events')}`"
        @click="activeTab = tab.key"
        class="flex shrink-0 items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-all"
        :class="
          activeTab === tab.key
            ? 'bg-primary text-primary-contrast shadow-md shadow-primary/20'
            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-white'
        "
      >
        <component :is="tab.icon" :size="15" />
        {{ tab.label }}
        <span
          class="rounded-full px-2 py-0.5 text-[11px] font-bold tabular-nums"
          :class="
            activeTab === tab.key
              ? 'bg-white/20 text-primary-contrast'
              : 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-300'
          "
        >
          {{ tab.count }}
        </span>
      </button>
    </div>

    <!-- Filter & Search Bar -->
    <div
      class="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800"
    >
      <div class="relative min-w-[260px] flex-1">
        <Search
          :size="16"
          class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500"
        />
        <input
          v-model="searchQuery"
          type="search"
          :placeholder="t('searchPlaceholder')"
          class="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm text-slate-800 placeholder:text-slate-400 outline-none shadow-sm transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder-slate-500"
        />
      </div>

      <div class="flex flex-wrap items-center gap-3">
        <!-- Category Filter -->
        <div class="flex items-center gap-2">
          <label
            class="text-xs font-semibold text-slate-500 dark:text-slate-400"
            >{{ t("eventCategory") }}</label
          >
          <select
            v-model="selectedCategory"
            class="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 outline-none shadow-sm focus:border-primary dark:border-slate-700 dark:bg-slate-800 dark:text-white"
          >
            <option value="All">{{ t("all") }}</option>
            <option v-for="c in categoriesList" :key="c.id" :value="c.id">
              {{ c.name }}
            </option>
          </select>
        </div>

        <!-- Status Filter -->
        <div class="flex items-center gap-2">
          <label
            class="text-xs font-semibold text-slate-500 dark:text-slate-400"
            >{{ t("eventStatus") }}</label
          >
          <select
            v-model="selectedStatus"
            class="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 outline-none shadow-sm focus:border-primary capitalize dark:border-slate-700 dark:bg-slate-800 dark:text-white"
          >
            <option v-for="st in statuses" :key="st" :value="st">
              {{ statusDisplayMap[st] || st }}
            </option>
          </select>
        </div>
      </div>
    </div>

    <!-- Events Table -->
    <div
      class="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800"
    >
      <div
        class="flex items-center justify-between border-b border-slate-200 px-6 py-4 dark:border-slate-700"
      >
        <h2 class="text-base font-bold text-slate-900 dark:text-white">
          {{ t("events") }} ({{ total }})
        </h2>
      </div>

      <!-- Table Loading Skeleton -->
      <div
        v-if="loading && !events.length"
        class="divide-y divide-slate-100 dark:divide-slate-700"
      >
        <div
          v-for="n in 5"
          :key="n"
          class="flex items-center gap-6 px-6 py-4 animate-pulse"
        >
          <div class="h-4 w-48 rounded bg-slate-200 dark:bg-slate-600"></div>
          <div class="h-4 w-28 rounded bg-slate-200 dark:bg-slate-600"></div>
          <div class="h-4 w-32 rounded bg-slate-200 dark:bg-slate-600"></div>
          <div class="h-4 w-20 rounded bg-slate-200 dark:bg-slate-600"></div>
        </div>
      </div>

      <div v-else class="overflow-x-auto">
        <table class="w-full text-left text-sm">
          <thead
            class="bg-slate-50/70 border-b border-slate-200 dark:bg-slate-700/50 dark:border-slate-700"
          >
            <tr
              class="text-[11px] font-bold text-slate-500 uppercase tracking-wider dark:text-slate-400"
            >
              <th class="px-6 py-3">{{ t("eventHeader") }}</th>
              <th class="px-6 py-3">{{ t("datesTiming") }}</th>
              <th class="px-6 py-3">{{ t("venueLocation") }}</th>
              <th class="px-6 py-3">{{ t("status") }}</th>
              <th class="px-6 py-3">{{ t("type") }}</th>
              <th class="px-6 py-3 text-right">{{ t("actions") }}</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 dark:divide-slate-700">
            <tr
              v-for="event in events"
              :key="event.id"
              class="transition-colors hover:bg-slate-50/80 dark:hover:bg-slate-700/50"
            >
              <td class="px-6 py-4">
                <div class="flex items-center gap-3">
                  <div
                    class="h-12 w-16 shrink-0 overflow-hidden rounded-md bg-slate-100 dark:bg-slate-700"
                  >
                    <img
                      v-if="coverImage(event)"
                      :src="coverImage(event)"
                      :alt="event.title"
                      class="h-full w-full object-cover"
                    />
                    <span
                      v-else
                      class="flex h-full w-full items-center justify-center"
                    >
                      <Calendar
                        :size="16"
                        class="text-slate-300 dark:text-slate-600"
                      />
                    </span>
                  </div>
                  <div class="min-w-0">
                    <p class="font-semibold text-slate-900 dark:text-white">{{ event.title }}</p>
                    <div class="mt-1 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                      <span class="rounded bg-slate-100 border border-slate-200 px-1.5 py-0.5 text-[10px] font-semibold text-primary-accent dark:bg-slate-700 dark:border-slate-600 dark:text-primary-accent">{{ event.category?.name || t('na') }}</span>
                      <span class="truncate">{{ t("by") }} {{ event.organizer?.company_name || t("na") }}</span>
                    </div>
                  </div>
                </div>
              </td>
              <td class="px-6 py-4 text-slate-700 dark:text-slate-300">
                <template v-if="formatDateTimeRangeParts(event).dateLabel">
                  <div
                    class="text-sm font-semibold text-slate-900 dark:text-white"
                  >
                    {{ formatDateTimeRangeParts(event).dateLabel }}
                  </div>
                  <div
                    v-if="formatDateTimeRangeParts(event).timeLabel"
                    class="text-xs text-slate-400 dark:text-slate-500"
                  >
                    {{ formatDateTimeRangeParts(event).timeLabel }}
                  </div>
                </template>
                <template v-else>
                  <div
                    class="text-sm font-semibold text-slate-900 dark:text-white"
                  >
                    {{ event.start_date }}
                  </div>
                </template>
              </td>
              <td class="px-6 py-4 text-slate-700 dark:text-slate-300">
                <div class="flex items-center gap-1.5 text-xs font-medium">
                  <MapPin :size="13" class="text-primary-accent" />
                  {{ event.venue?.name || t('na') }}
                </div>
              </td>
              <td class="px-6 py-4 w-32">
                <span
                  class="rounded-full border px-2 py-0.5 text-[11px] font-semibold capitalize"
                  :class="statusStyle[event.status]"
                >
                  {{ statusDisplayMap[event.status] || event.status }}
                </span>
              </td>

              <!-- Type: Trending (manual toggle) + Upcoming (auto badge) -->
              <td class="px-6 py-4">
                <div class="flex flex-col items-start gap-1.5">
                  <button
                    type="button"
                    role="switch"
                    :aria-checked="Boolean(event.is_trending)"
                    :aria-label="`${event.is_trending ? t('removeFromTrending') : t('markTrending')} ${event.title}`"
                    :title="event.is_trending ? t('removeFromTrending') : t('markTrending')"
                    :disabled="trendingBusy.has(event.id)"
                    @click="toggleTrending(event)"
                    class="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold transition-all disabled:cursor-wait"
                    :class="[
                      trendingBusy.has(event.id) ? 'opacity-60 pointer-events-none' : '',
                      event.is_trending
                        ? 'bg-primary text-primary-contrast shadow-sm hover:bg-primary-hover'
                        : 'border border-slate-300 bg-white text-slate-500 hover:border-primary hover:text-primary-accent dark:border-slate-600 dark:bg-slate-700 dark:text-slate-300 dark:hover:border-primary dark:hover:text-primary-accent',
                    ]"
                  >
                    <Flame :size="12" :fill="event.is_trending ? 'currentColor' : 'none'" />
                    {{ event.is_trending ? t("trending") : t("markTrending") }}
                  </button>

                  <span
                    v-if="event.is_upcoming"
                    :title="t('upcomingAutoNote')"
                    class="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/15 dark:text-emerald-400"
                  >
                    <Calendar :size="12" />
                    {{ t("upcomingHeader") }}
                  </span>
                  <span
                    v-else
                    :title="t('upcomingAutoNote')"
                    class="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-medium text-slate-400 dark:border-slate-600 dark:bg-slate-700/40 dark:text-slate-500"
                  >
                    {{ t("notUpcoming") }}
                  </span>
                </div>
              </td>
              <td class="px-6 py-4 text-right">
                <div class="flex items-center justify-end gap-1.5">
                  <button
                    type="button"
                    @click="viewEvent(event.id)"
                    class="rounded-lg border border-slate-200 bg-slate-50 p-1.5 text-slate-600 hover:border-primary hover:text-primary-accent hover:bg-primary/10 dark:border-slate-700 dark:bg-slate-700 dark:text-slate-400 dark:hover:bg-primary/10"
                    :title="t('viewDetails')"
                    :aria-label="`${t('viewDetails')}: ${event.title}`"
                  >
                    <Eye :size="14" />
                  </button>
                  <button
                    type="button"
                    @click="openEditModal(event)"
                    class="rounded-lg border border-slate-200 bg-slate-50 p-1.5 text-slate-600 hover:border-primary hover:text-primary-accent hover:bg-primary/10 dark:border-slate-700 dark:bg-slate-700 dark:text-slate-400 dark:hover:bg-primary/10"
                    :title="t('editEvent')"
                    :aria-label="`${t('editEvent')}: ${event.title}`"
                  >
                    <Edit :size="14" />
                  </button>
                  <button
                    type="button"
                    @click="deleteEvent(event.id)"
                    class="rounded-lg border border-rose-200 bg-rose-50 p-1.5 text-rose-600 hover:bg-rose-100 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-400 dark:hover:bg-red-500/20"
                    :title="t('delete')"
                    :aria-label="`${t('delete')}: ${event.title}`"
                  >
                    <Trash2 :size="14" />
                  </button>
                </div>
              </td>
            </tr>
            <tr v-if="events.length === 0">
              <td
                colspan="6"
                class="px-6 py-8 text-center text-sm text-slate-400 dark:text-slate-500"
              >
                {{ t("noEventsFound") }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div
        v-if="!loading && total > 0"
        class="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 px-6 py-3 dark:border-slate-700"
      >
        <span class="text-xs text-slate-500 dark:text-slate-400">
          {{ t("showingResult", { from, to, total }) }}
        </span>
        <div class="flex items-center gap-2">
          <button
            type="button"
            :disabled="currentPage <= 1"
            @click="goToPage(currentPage - 1)"
            class="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-primary hover:text-primary-accent disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
          >
            <ChevronLeft :size="14" />
            {{ t("previous") }}
          </button>
          <span
            class="text-xs font-semibold tabular-nums text-slate-600 dark:text-slate-300"
          >
            {{ t("page") }} {{ currentPage }} {{ t("of") }} {{ lastPage }}
          </span>
          <button
            type="button"
            :disabled="currentPage >= lastPage"
            @click="goToPage(currentPage + 1)"
            class="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-primary hover:text-primary-accent disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
          >
            {{ t("next") }}
            <ChevronRight :size="14" />
          </button>
        </div>
      </div>
    </div>

    <!-- Create / Edit Event Modal -->
    <div
      v-if="isModalOpen"
      class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm"
    >
      <div
        class="w-full max-w-xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl max-h-[90vh] overflow-y-auto dark:border-slate-700 dark:bg-slate-800"
      >
        <div
          class="mb-5 flex items-center justify-between border-b border-slate-200 pb-4 dark:border-slate-700"
        >
          <h3 class="text-lg font-bold text-slate-900 dark:text-white">
            {{ editingEvent ? t("editEvent") : t("createNewEvent") }}
          </h3>
          <button
            type="button"
            @click="isModalOpen = false"
            :aria-label="t('close')"
            class="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:text-slate-500 dark:hover:bg-slate-700 dark:hover:text-white"
          >
            <X :size="18" />
          </button>
        </div>

        <form @submit.prevent="saveEvent" class="space-y-4">
          <div>
            <label
              class="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300"
              >{{ t("eventTitle") }} *</label
            >
            <input
              v-model="form.title"
              type="text"
              required
              :placeholder="t('eventTitlePlaceholder')"
              class="w-full rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2 text-sm text-slate-900 outline-none focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-slate-700 dark:bg-slate-700 dark:text-white dark:focus:bg-slate-800"
            />
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label
                class="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300"
                >{{ t("categoryName") }} *</label
              >
              <select
                v-model="form.category_id"
                required
                class="w-full rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2 text-sm text-slate-900 outline-none focus:bg-white focus:border-primary dark:border-slate-700 dark:bg-slate-700 dark:text-white dark:focus:bg-slate-800"
              >
                <option value="" disabled>{{ t("selectCategory") }}</option>
                <option v-for="c in categoriesList" :key="c.id" :value="c.id">
                  {{ c.name }}
                </option>
              </select>
            </div>
            <div>
              <label
                class="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300"
                >{{ t("organizerHeader") }} *</label
              >
              <select
                v-model="form.organizer_id"
                required
                class="w-full rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2 text-sm text-slate-900 outline-none focus:bg-white focus:border-primary dark:border-slate-700 dark:bg-slate-700 dark:text-white dark:focus:bg-slate-800"
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
              <label
                class="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300"
                >{{ t("venues") }} *</label
              >
              <select
                v-model="form.venue_id"
                required
                class="w-full rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2 text-sm text-slate-900 outline-none focus:bg-white focus:border-primary dark:border-slate-700 dark:bg-slate-700 dark:text-white dark:focus:bg-slate-800"
              >
                <option value="" disabled>{{ t("selectVenue") }}</option>
                <option v-for="v in venuesList" :key="v.id" :value="v.id">
                  {{ v.name }}
                </option>
              </select>
            </div>
            <div>
              <label
                class="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300"
                >{{ t("status") }}</label
              >
              <select
                v-model="form.status"
                class="w-full rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2 text-sm text-slate-900 outline-none focus:bg-white focus:border-primary capitalize dark:border-slate-700 dark:bg-slate-700 dark:text-white dark:focus:bg-slate-800"
              >
                <option value="published">{{ t("published") }}</option>
                <option value="draft">{{ t("draft") }}</option>
                <option value="cancelled">{{ t("cancelled") }}</option>
              </select>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label
                class="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300"
                >{{ t("startDate") }} *</label
              >
              <input
                v-model="form.start_date"
                type="date"
                required
                class="w-full rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2 text-sm text-slate-900 outline-none focus:bg-white focus:border-primary dark:border-slate-700 dark:bg-slate-700 dark:text-white dark:focus:bg-slate-800"
              />
            </div>
            <div>
              <label
                class="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300"
                >{{ t("endDate") }} *</label
              >
              <input
                v-model="form.end_date"
                type="date"
                required
                class="w-full rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2 text-sm text-slate-900 outline-none focus:bg-white focus:border-primary dark:border-slate-700 dark:bg-slate-700 dark:text-white dark:focus:bg-slate-800"
              />
            </div>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label
                class="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300"
                >{{ t("startTime") }}</label
              >
              <input
                v-model="form.start_time"
                type="time"
                class="w-full rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2 text-sm text-slate-900 outline-none focus:bg-white focus:border-primary dark:border-slate-700 dark:bg-slate-700 dark:text-white dark:focus:bg-slate-800"
              />
            </div>
            <div>
              <label
                class="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300"
                >{{ t("endTime") }}</label
              >
              <input
                v-model="form.end_time"
                type="time"
                class="w-full rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2 text-sm text-slate-900 outline-none focus:bg-white focus:border-primary dark:border-slate-700 dark:bg-slate-700 dark:text-white dark:focus:bg-slate-800"
              />
            </div>
          </div>

          <div>
            <label
              class="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300"
              >{{ t("bannerImage") }}</label
            >
            <div class="flex items-center gap-4">
              <label
                class="flex cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 px-6 py-4 text-center text-slate-500 transition-colors hover:border-primary hover:bg-primary/10 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-400 dark:hover:bg-primary/10"
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
            <label
              class="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300"
              >{{ t("description") }}</label
            >
            <textarea
              v-model="form.description"
              rows="3"
              class="w-full rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2 text-sm text-slate-900 outline-none focus:bg-white focus:border-primary dark:border-slate-700 dark:bg-slate-700 dark:text-white dark:focus:bg-slate-800"
            />
          </div>

          <div
            v-if="formError"
            class="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-400"
          >
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
              class="rounded-lg bg-primary px-5 py-2 text-xs font-semibold text-primary-contrast shadow-sm transition-all hover:bg-primary-hover"
            >
              {{ editingEvent ? t("saveChanges") : t("createEvent") }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </main>
</template>