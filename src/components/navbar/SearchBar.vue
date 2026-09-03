<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { useRouter } from "vue-router";
import { Search, X, Calendar, MapPin, Loader2 } from "lucide-vue-next";
import { searchEvents } from "../../api/eventApi.js";
import { coverImage, formatDate, formatTime, minPrice, formatPrice } from "../../utils/event.js";

const emit = defineEmits(["submit"]);

const router = useRouter();

const query = ref("");
const results = ref([]);
const open = ref(false);
const loading = ref(false);
const error = ref("");
const box = ref(null);
let debounceTimer = null;

const hasResults = computed(() => results.value.length > 0);

function debouncedSearch() {
  clearTimeout(debounceTimer);
  if (!query.value.trim()) {
    results.value = [];
    loading.value = false;
    return;
  }
  loading.value = true;
  open.value = true;
  debounceTimer = setTimeout(async () => {
    try {
      results.value = await searchEvents(query.value.trim());
      error.value = "";
    } catch (e) {
      error.value = e.message || "Search failed.";
      results.value = [];
    } finally {
      loading.value = false;
    }
  }, 300);
}

function clear() {
  query.value = "";
  results.value = [];
  open.value = false;
}

function select(event) {
  if (!event) return;
  open.value = false;
  router.push(`/events/${event.id}`);
}

function submit() {
  if (!query.value.trim()) return;
  open.value = false;
  router.push({ path: "/events", query: { search: query.value.trim() } });
  emit("submit", query.value.trim());
}

function onClickOutside(event) {
  if (box.value && !box.value.contains(event.target)) {
    open.value = false;
  }
}

onMounted(() => document.addEventListener("click", onClickOutside));
onBeforeUnmount(() => {
  clearTimeout(debounceTimer);
  document.removeEventListener("click", onClickOutside);
});
</script>

<template>
  <div ref="box" class="relative w-full max-w-md">
    <div
      class="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3.5 py-2 transition focus-within:border-[#FFA500]/60 focus-within:bg-white/10"
    >
      <Search :size="16" class="shrink-0 text-white/50" />
      <input
        v-model="query"
        type="text"
        placeholder="Search events, categories, venues..."
        class="w-full bg-transparent text-sm text-white placeholder:text-white/40 focus:outline-none"
        @input="debouncedSearch"
        @focus="query.trim() && (open = true)"
        @keydown.enter="submit"
      />
      <button
        v-if="query"
        type="button"
        class="shrink-0 text-white/40 hover:text-white"
        aria-label="Clear search"
        @click="clear"
      >
        <X :size="14" />
      </button>
    </div>

    <transition
      enter-active-class="transition duration-150 ease-out"
      enter-from-class="-translate-y-1 opacity-0"
      enter-to-class="translate-y-0 opacity-100"
      leave-active-class="transition duration-100 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="open"
        class="absolute left-0 right-0 top-12 z-30 max-h-[60vh] overflow-y-auto rounded-2xl border border-white/10 bg-[#14171C]/95 p-1.5 shadow-2xl shadow-black/60 backdrop-blur-xl"
      >
        <div v-if="loading" class="flex items-center gap-2 px-4 py-3">
          <Loader2 :size="16" class="animate-spin text-[#FFA500]" />
          <span class="text-sm text-[#9CA3AF]">Searching...</span>
        </div>

        <p v-else-if="error" class="px-4 py-3 text-sm text-red-400">{{ error }}</p>

        <template v-else-if="hasResults">
          <button
            v-for="r in results"
            :key="r.id"
            type="button"
            class="flex w-full items-center gap-3 rounded-xl p-2.5 text-left transition hover:bg-white/5"
            @click="select(r)"
          >
            <span class="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-[#1D2229]">
              <img
                v-if="coverImage(r)"
                :src="coverImage(r)"
                :alt="r.title"
                class="h-full w-full object-cover"
              />
            </span>
            <span class="min-w-0 flex-1">
              <span class="block truncate text-sm font-semibold text-white">{{ r.title }}</span>
              <span class="block truncate text-xs text-[#9CA3AF]">
                {{ r.category?.name }}
                <template v-if="r.start_date"> · {{ formatDate(r.start_date) }}</template>
              </span>
              <span v-if="r.venue?.name" class="flex items-center gap-1 text-xs text-[#9CA3AF]">
                <MapPin :size="11" />
                <span class="truncate">{{ r.venue.name }}</span>
              </span>
            </span>
            <span v-if="minPrice(r) !== null" class="shrink-0 text-xs font-bold text-[#FFA500]">
              {{ formatPrice(minPrice(r)) }}
            </span>
          </button>
        </template>

        <p v-else class="px-4 py-3 text-sm text-[#9CA3AF]">
          No events found{{ query ? ` for "${query}"` : "" }}.
        </p>
      </div>
    </transition>
  </div>
</template>
