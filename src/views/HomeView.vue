<script setup>
import { computed, onMounted, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import {
  getTrendingEvents,
  getUpcomingEvents,
  getEventsByCategory,
} from "../api/eventApi.js";
import { getCategories } from "../api/categoryApi.js";
import HeroEvent from "../components/event/HeroEvent.vue";
import EventCarousel from "../components/event/EventCarousel.vue";
import CategorySection from "../components/event/CategorySection.vue";
import CategoryFilter from "../components/category/CategoryFilter.vue";

const { t } = useI18n();

const trendingEvents = ref([]);
const upcomingEvents = ref([]);
const categories = ref([]);

const trendingLoading = ref(true);
const upcomingLoading = ref(true);
const trendingError = ref(false);
const upcomingError = ref(false);

// Map of categoryId -> events array for the per-category rows.
const categoryEvents = ref({});
const categoryLoading = ref(new Set());

const selectedCategory = ref(null);

const filteredSections = computed(() => {
  if (!selectedCategory.value) return categories.value;
  return categories.value.filter(
    (c) => String(c.id) === String(selectedCategory.value)
  );
});

async function loadTrending() {
  trendingLoading.value = true;
  trendingError.value = false;
  try {
    trendingEvents.value = await getTrendingEvents();
  } catch {
    trendingEvents.value = [];
    trendingError.value = true;
  } finally {
    trendingLoading.value = false;
  }
}

async function loadUpcoming() {
  upcomingLoading.value = true;
  upcomingError.value = false;
  try {
    upcomingEvents.value = await getUpcomingEvents();
  } catch {
    upcomingEvents.value = [];
    upcomingError.value = true;
  } finally {
    upcomingLoading.value = false;
  }
}

async function loadCategoryEvents(categoryId) {
  if (categoryEvents.value[categoryId]) return;
  categoryLoading.value.add(categoryId);
  try {
    const { events } = await getEventsByCategory(categoryId);
    categoryEvents.value = { ...categoryEvents.value, [categoryId]: events };
  } catch {
    categoryEvents.value = { ...categoryEvents.value, [categoryId]: [] };
  } finally {
    categoryLoading.value.delete(categoryId);
  }
}

function eventsFor(category) {
  return categoryEvents.value[category.id] || [];
}

function isCategoryLoading(category) {
  return categoryLoading.value.has(category.id);
}

// Load the events for the currently visible (filtered) categories.
async function loadVisibleCategories() {
  for (const category of filteredSections.value) {
    await loadCategoryEvents(category.id);
  }
}

function onSelectCategory(id) {
  selectedCategory.value = id;
  if (id && !categoryEvents.value[id]) {
    loadCategoryEvents(id);
  }
}

async function bootstrap() {
  await Promise.all([loadTrending(), loadUpcoming()]);
  try {
    categories.value = await getCategories();
  } catch {
    categories.value = [];
  }
  await loadVisibleCategories();
}

onMounted(bootstrap);

// Reload visible category events when the filter changes.
watch(selectedCategory, loadVisibleCategories);
</script>

<template>
  <div>
    <!-- Hero / Trending -->
    <HeroEvent
      :events="trendingEvents"
      :loading="trendingLoading"
      :error="trendingError"
      @retry="loadTrending"
    />

    <!-- Page content -->
    <div class="relative z-10 -mt-10 space-y-14 px-4 pb-20 sm:px-6 lg:px-8">
      <!-- Explore by category -->
      <section class="mx-auto w-full max-w-7xl">
        <div class="mb-4">
          <h2 class="text-lg font-bold tracking-tight text-slate-900 dark:text-white sm:text-xl">{{ t('exploreByCategory') }}</h2>
          <p class="mt-0.5 text-xs text-slate-500 dark:text-[#9CA3AF]">{{ t('exploreByCategoryDesc') }}</p>
        </div>
        <CategoryFilter
          :categories="categories"
          :selected-id="selectedCategory"
          @select="onSelectCategory"
        />
      </section>

      <!-- Trending -->
      <section class="mx-auto w-full max-w-7xl">
        <EventCarousel
          :title="t('trendingEvents')"
          :subtitle="t('trendingEventsDesc')"
          :events="selectedCategory
            ? trendingEvents.filter(e => String(e.category_id) === String(selectedCategory))
            : trendingEvents"
          :loading="trendingLoading"
        />
      </section>

      <!-- Upcoming -->
      <section class="mx-auto w-full max-w-7xl">
        <div
          v-if="upcomingError"
          class="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-[#14171C]/50 px-6 py-12 text-center"
        >
          <p class="text-sm text-slate-500 dark:text-[#9CA3AF]">{{ t('upcomingLoadError') }}</p>
          <button
            type="button"
            class="mt-4 inline-flex items-center gap-2 rounded-full bg-[#FFA500] px-5 py-2.5 text-sm font-bold text-black shadow-lg shadow-[#FFA500]/25 transition hover:bg-[#FFB52E] active:scale-[0.98]"
            @click="loadUpcoming"
          >
            {{ t('retry') }}
          </button>
        </div>

        <EventCarousel
          v-else
          :title="t('upcomingEvents')"
          :subtitle="t('upcomingEventsDesc')"
          :events="selectedCategory
            ? upcomingEvents.filter(e => String(e.category_id) === String(selectedCategory))
            : upcomingEvents"
          :loading="upcomingLoading"
          :empty-text="t('noUpcomingEvents')"
        />
      </section>

      <!-- Events grouped by category -->
      <section v-for="category in filteredSections" :key="category.id" class="mx-auto w-full max-w-7xl">
        <CategorySection
          :category="category"
          :events="eventsFor(category)"
          :loading="isCategoryLoading(category)"
        />
      </section>
    </div>
  </div>
</template>
