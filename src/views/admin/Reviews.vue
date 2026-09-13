<script setup>
import { ref, computed, onMounted } from "vue";
import { adminApi } from "@/api/admin.js";
import {
  Star,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  Trash2,
  ArrowUpRight,
  MessageSquare,
  Eye,
  X,
  ThumbsUp,
  RefreshCw,
} from "lucide-vue-next";
import { useI18n } from "vue-i18n";
const { t } = useI18n();

function statusLabel(s) {
  if (s === 'All') return t('all');
  return s ? t(s) : t('na');
}

function ratingLabel(r) {
  if (r === 'All') return t('all');
  const n = parseInt(r[0]);
  return n === 1 ? t('star', { count: 1 }) : t('stars', { count: n });
}

const loading = ref(true);
const error = ref(null);

const searchQuery = ref("");
const selectedRating = ref("All");
const selectedStatus = ref("All");

const reviews = ref([]);

async function fetchReviews() {
  loading.value = true;
  error.value = null;
  try {
    const response = await adminApi.getReviews();
    reviews.value = (response.data || []).map((r) => ({
      id: r.id,
      user: {
        id: r.user?.id,
        name: r.user?.name || t('unknown'),
        email: r.user?.email || "",
        initials: (r.user?.name || "?").split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2),
      },
      event: {
        id: r.event?.id,
        title: r.event?.title || t('na'),
      },
      rating: r.rating,
      comment: r.comment,
      status: r.status,
      created_at: r.created_at ? new Date(r.created_at).toLocaleDateString() : t('na'),
    }));
  } catch (e) {
    error.value = e.response?.data?.message || e.message || t('failedToLoadReviews');
  } finally {
    loading.value = false;
  }
}

onMounted(fetchReviews);

const stats = computed(() => {
  const total = reviews.value.length;
  const avg = total
    ? (reviews.value.reduce((s, r) => s + Number(r.rating || 0), 0) / total).toFixed(1)
    : "0.0";
  const published = reviews.value.filter((r) => r.status === "published").length;
  const pending = reviews.value.filter((r) => r.status === "pending").length;
  const fiveStars = reviews.value.filter((r) => r.rating === 5).length;

  return [
    {
      label: t('totalReviews'),
      value: total.toLocaleString(),
      change: t('publishedReviewsCount', { count: published }),
      icon: MessageSquare,
      color: "bg-blue-50 text-blue-600",
    },
    {
      label: t('averagePlatformRating'),
      value: `${avg} / 5.0`,
      change: total ? t('fiveStarRatingsPct', { pct: Math.round((fiveStars / total) * 100) }) : t('noRatingsYet'),
      icon: Star,
      color: "bg-amber-50 text-amber-600",
    },
    {
      label: t('pendingModeration'),
      value: pending.toLocaleString(),
      change: t('awaitingStaffReview'),
      icon: Clock,
      color: "bg-orange-50 text-orange-600",
    },
  ];
});

const ratings = ["All", "5 Stars", "4 Stars", "3 Stars", "2 Stars", "1 Star"];
const statuses = ["All", "published", "pending", "rejected"];

const statusStyle = {
  published: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-400 dark:border-emerald-500/30",
  active: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-400 dark:border-emerald-500/30",
  pending: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/15 dark:text-amber-400 dark:border-amber-500/30",
  rejected: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/15 dark:text-rose-400 dark:border-rose-500/30",
};

const filteredReviews = computed(() => {
  return reviews.value.filter((r) => {
    const matchesSearch =
      r.user.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      r.event.title.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      (r.comment || "").toLowerCase().includes(searchQuery.value.toLowerCase());

    const matchesRating =
      selectedRating.value === "All" ||
      r.rating === parseInt(selectedRating.value[0]);

    const matchesStatus =
      selectedStatus.value === "All" || r.status === selectedStatus.value;

    return matchesSearch && matchesRating && matchesStatus;
  });
});

async function updateStatus(id, newStatus) {
  const rev = reviews.value.find((r) => r.id === id);
  if (rev) {
    try {
      await adminApi.updateReview(id, { status: newStatus });
      rev.status = newStatus;
    } catch (e) {
      error.value = e.response?.data?.message || e.message || t('failedToUpdateReviewStatus');
    }
  }
}

async function deleteReview(id) {
  if (confirm(t('confirmDeleteReview'))) {
    try {
      await adminApi.deleteReview(id);
      reviews.value = reviews.value.filter((r) => r.id !== id);
    } catch (e) {
      error.value = e.response?.data?.message || e.message || t('failedToDeleteReview');
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
          <h1 class="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">{{ t('reviewsManagement') }}</h1>
          <span class="rounded-md bg-yellow-100 border border-yellow-200 px-2.5 py-0.5 text-xs text-yellow-800 font-mono font-medium dark:bg-yellow-500/15 dark:border-yellow-500/30 dark:text-yellow-400">
            manage_reviews
          </span>
        </div>
        <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">{{ t('reviewsDesc') }}</p>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="flex items-center justify-center py-20">
      <div class="flex items-center gap-3 text-slate-500 dark:text-slate-400">
        <RefreshCw :size="18" class="animate-spin" />
        <span class="text-sm font-medium">{{ t('loadingReviews') }}</span>
      </div>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="flex items-center justify-center py-20">
      <div class="rounded-xl border border-rose-200 bg-rose-50 p-6 text-center dark:border-rose-500/30 dark:bg-rose-500/10">
        <XCircle :size="24" class="mx-auto mb-2 text-rose-500" />
        <p class="text-sm font-semibold text-rose-700 dark:text-rose-400">{{ error }}</p>
        <button @click="fetchReviews" class="mt-3 rounded-lg bg-amber-500 px-4 py-2 text-xs font-semibold text-slate-950 hover:bg-amber-600">
          {{ t('retry') }}
        </button>
      </div>
    </div>

    <!-- Data Loaded -->
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
            :placeholder="t('searchReviewsPlaceholder')"
            class="w-full rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 py-2 pl-9 pr-3 text-sm text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none shadow-sm transition-all focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
          />
        </div>

        <div class="flex flex-wrap items-center gap-3">
          <div class="flex items-center gap-2">
            <label class="text-xs font-semibold text-slate-500 dark:text-slate-400">{{ t('rating') }}:</label>
            <select
              v-model="selectedRating"
              class="rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2 text-xs text-slate-800 dark:text-slate-100 outline-none shadow-sm focus:border-amber-500"
            >
              <option v-for="rt in ratings" :key="rt" :value="rt">{{ ratingLabel(rt) }}</option>
            </select>
          </div>

          <div class="flex items-center gap-2">
            <label class="text-xs font-semibold text-slate-500 dark:text-slate-400">{{ t('eventStatus') }}</label>
            <select
              v-model="selectedStatus"
              class="rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2 text-xs text-slate-800 dark:text-slate-100 outline-none shadow-sm focus:border-amber-500 capitalize"
            >
              <option v-for="st in statuses" :key="st" :value="st">{{ statusLabel(st) }}</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Reviews Table -->
      <div class="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm">
        <div class="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 px-6 py-4">
          <h2 class="text-base font-bold text-slate-900 dark:text-white">{{ t('userReviewsCount', { count: filteredReviews.length }) }}</h2>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full text-left text-sm">
            <thead class="bg-slate-50/70 dark:bg-slate-700/50 border-b border-slate-200 dark:border-slate-700">
              <tr class="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                <th class="px-6 py-3">{{ t('attendee') }}</th>
                <th class="px-6 py-3">{{ t('event') }}</th>
                <th class="px-6 py-3">{{ t('rating') }}</th>
                <th class="px-6 py-3">{{ t('comment') }}</th>
                <th class="px-6 py-3">{{ t('status') }}</th>
                <th class="px-6 py-3">{{ t('date') }}</th>
                <th class="px-6 py-3 text-right">{{ t('moderation') }}</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 dark:divide-slate-700">
              <tr
                v-for="r in filteredReviews"
                :key="r.id"
                class="transition-colors hover:bg-slate-50/80 dark:hover:bg-slate-700/50"
              >
                <td class="px-6 py-4">
                  <div class="flex items-center gap-2.5">
                    <span class="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-700 font-bold text-xs text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-600">
                      {{ r.user.initials }}
                    </span>
                    <div>
                      <p class="font-semibold text-slate-900 dark:text-white">{{ r.user.name }}</p>
                      <p class="text-[11px] text-slate-400 dark:text-slate-500">{{ r.user.email }}</p>
                    </div>
                  </div>
                </td>
                <td class="px-6 py-4 text-xs font-semibold text-slate-800 dark:text-slate-200 max-w-xs truncate">
                  {{ r.event.title }}
                </td>
                <td class="px-6 py-4">
                  <div class="flex items-center gap-1">
                    <Star
                      v-for="i in 5"
                      :key="i"
                      :size="13"
                      :class="i <= r.rating ? 'text-amber-500 fill-amber-500' : 'text-slate-200 dark:text-slate-600'"
                    />
                  </div>
                </td>
                <td class="px-6 py-4 text-xs text-slate-600 dark:text-slate-400 max-w-sm">
                  <p class="line-clamp-2 leading-relaxed">{{ r.comment }}</p>
                </td>
                <td class="px-6 py-4">
                  <span class="rounded-full border px-2.5 py-0.5 text-[11px] font-semibold capitalize" :class="statusStyle[r.status]">
                    {{ statusLabel(r.status) }}
                  </span>
                </td>
                <td class="px-6 py-4 text-xs text-slate-500 dark:text-slate-400">
                  {{ r.created_at }}
                </td>
                <td class="px-6 py-4 text-right">
                  <div class="flex items-center justify-end gap-1.5">
                    <button
                      v-if="r.status !== 'published'"
                      type="button"
                      @click="updateStatus(r.id, 'published')"
                      :title="t('approveReview')"
                      class="rounded-lg border border-emerald-200 bg-emerald-50 p-1.5 text-emerald-600 hover:bg-emerald-100"
                    >
                      <CheckCircle2 :size="14" />
                    </button>
                    <button
                      v-if="r.status !== 'rejected'"
                      type="button"
                      @click="updateStatus(r.id, 'rejected')"
                      :title="t('rejectReview')"
                      class="rounded-lg border border-amber-200 bg-amber-50 p-1.5 text-amber-600 hover:bg-amber-100"
                    >
                      <XCircle :size="14" />
                    </button>
                    <button
                      type="button"
                      @click="deleteReview(r.id)"
                      :title="t('deleteReview')"
                      class="rounded-lg border border-rose-200 bg-rose-50 p-1.5 text-rose-600 hover:bg-rose-100 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-400 dark:hover:bg-red-500/20"
                    >
                      <Trash2 :size="14" />
                    </button>
                  </div>
                </td>
              </tr>
              <tr v-if="filteredReviews.length === 0">
                <td colspan="7" class="px-6 py-8 text-center text-sm text-slate-400 dark:text-slate-500">
                  {{ t('noReviewsMatchingCriteria') }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </template>
  </main>
</template>
