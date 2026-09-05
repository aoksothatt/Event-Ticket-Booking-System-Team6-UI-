<script setup>
import { computed, onMounted, ref, watch } from "vue";
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

const trendingEvents = ref([]);
const upcomingEvents = ref([]);
const categories = ref([]);

const trendingLoading = ref(true);
const upcomingLoading = ref(true);
const trendingError = ref(false);

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
  try {
    upcomingEvents.value = await getUpcomingEvents();
  } catch {
    upcomingEvents.value = [];
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
          <h2 class="text-lg font-bold tracking-tight text-white sm:text-xl">Explore by Category</h2>
          <p class="mt-0.5 text-xs text-[#9CA3AF]">Browse events by what interests you.</p>
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
          title="Trending Events"
          subtitle="What everyone is talking about right now."
          :events="selectedCategory
            ? trendingEvents.filter(e => String(e.category_id) === String(selectedCategory))
            : trendingEvents"
          :loading="trendingLoading"
        />
      </section>

      <!-- Upcoming -->
      <section class="mx-auto w-full max-w-7xl">
        <EventCarousel
          title="Upcoming Events"
          subtitle="Mark your calendar — these are coming up soon."
          :events="selectedCategory
            ? upcomingEvents.filter(e => String(e.category_id) === String(selectedCategory))
            : upcomingEvents"
          :loading="upcomingLoading"
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
