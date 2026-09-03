<script setup>
import { onMounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { getEvents } from "../api/eventApi.js";
import { getCategories } from "../api/categoryApi.js";
import CategoryFilter from "../components/category/CategoryFilter.vue";
import EventCard from "../components/event/EventCard.vue";
import EventSkeleton from "../components/event/EventSkeleton.vue";
import { Search } from "lucide-vue-next";

const route = useRoute();
const router = useRouter();

const events = ref([]);
const categories = ref([]);
const loading = ref(true);
const error = ref("");

// Hydrated from route query: ?category_id=... &search=...
const query = ref(route.query.search || "");
const selectedCategory = ref(route.query.category_id || null);

async function load() {
  loading.value = true;
  error.value = "";
  try {
    const params = {};
    if (query.value) params.search = query.value;
    if (selectedCategory.value) params.category_id = selectedCategory.value;
    params.per_page = 24;

    const { events: list } = await getEvents(params);
    events.value = list;
  } catch (e) {
    error.value = e.message || "Could not load events.";
    events.value = [];
  } finally {
    loading.value = false;
  }
}

function applyFilters() {
  const q = { ...route.query };
  if (query.value) q.search = query.value;
  else delete q.search;
  if (selectedCategory.value) q.category_id = selectedCategory.value;
  else delete q.category_id;
  router.replace({ query: q });
  load();
}

function onSelectCategory(id) {
  selectedCategory.value = id;
  applyFilters();
}

function onSearchSubmit() {
  applyFilters();
}

function clearSearch() {
  query.value = "";
  applyFilters();
}

onMounted(async () => {
  load();
  try {
    categories.value = await getCategories();
  } catch {
    categories.value = [];
  }
});

watch(
  () => route.query,
  () => {
    query.value = route.query.search || "";
    selectedCategory.value = route.query.category_id || null;
  }
);
</script>

<template>
  <div class="px-4 pb-20 pt-28 sm:px-6 lg:px-8">
    <div class="mx-auto w-full max-w-7xl">
      <div class="mb-6">
        <h1 class="text-2xl font-extrabold tracking-tight text-white sm:text-3xl">Events</h1>
        <p class="mt-1 text-sm text-[#9CA3AF]">Browse all events or narrow them down.</p>
      </div>

      <!-- Toolbar -->
      <div class="mb-8 space-y-4">
        <div class="flex max-w-md items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3.5 py-2 transition focus-within:border-[#FFA500]/60">
          <Search :size="16" class="shrink-0 text-white/50" />
          <input
            v-model="query"
            type="text"
            placeholder="Search events..."
            class="w-full bg-transparent text-sm text-white placeholder:text-white/40 focus:outline-none"
            @keydown.enter="onSearchSubmit"
          />
        </div>

        <CategoryFilter
          :categories="categories"
          :selected-id="selectedCategory"
          @select="onSelectCategory"
        />
      </div>

      <!-- Error -->
      <div
        v-if="error"
        class="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300"
      >
        {{ error }}
      </div>

      <!-- Skeleton -->
      <div v-if="loading">
        <EventSkeleton :count="6" />
      </div>

      <!-- Empty state -->
      <div
        v-else-if="!events.length"
        class="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 bg-[#14171C]/50 px-6 py-16 text-center"
      >
        <p class="text-sm text-[#9CA3AF]">
          {{ query ? `No events found for "${query}".` : "No events match this filter yet." }}
        </p>
        <button
          v-if="query || selectedCategory"
          type="button"
          class="mt-4 rounded-full bg-[#FFA500] px-5 py-2 text-sm font-semibold text-black transition hover:bg-[#FFB52E]"
          @click="clearSearch"
        >
          Clear filters
        </button>
      </div>

      <!-- Grid -->
      <div v-else class="grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
        <EventCard v-for="event in events" :key="event.id" :event="event" :show-save="true" />
      </div>
    </div>
  </div>
</template>
