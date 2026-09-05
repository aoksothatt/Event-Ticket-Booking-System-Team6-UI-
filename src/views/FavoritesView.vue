<script setup>
import { onMounted } from "vue";
import { useRouter } from "vue-router";
import { Heart, CalendarHeart } from "lucide-vue-next";
import EventCard from "../components/event/EventCard.vue";
import EventSkeleton from "../components/event/EventSkeleton.vue";
import { useFavorites } from "../composables/useFavorites.js";

const router = useRouter();
const { favorites, loading, error, loadFavorites, retry } = useFavorites();

onMounted(loadFavorites);
</script>

<template>
  <div class="px-4 pb-20 pt-28 sm:px-6 lg:px-8">
    <div class="mx-auto w-full max-w-7xl">
      <div class="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 class="text-2xl font-extrabold tracking-tight text-white sm:text-3xl">Favorites</h1>
          <p class="mt-1 text-sm text-[#9CA3AF]">Events you've saved so you won't miss out.</p>
        </div>
      </div>

      <!-- Loading -->
      <div v-if="loading">
        <EventSkeleton :count="4" />
      </div>

      <!-- Error -->
      <div
        v-else-if="error"
        class="flex flex-col items-center justify-center rounded-2xl border border-red-500/30 bg-red-500/10 px-6 py-16 text-center"
      >
        <p class="text-sm text-red-300">{{ error }}</p>
        <button
          type="button"
          class="mt-4 rounded-full bg-[#FFA500] px-5 py-2 text-sm font-semibold text-black transition hover:bg-[#FFB52E]"
          @click="retry"
        >
          Try Again
        </button>
      </div>

      <!-- Empty state -->
      <div
        v-else-if="!favorites.length"
        class="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 bg-[#14171C]/50 px-6 py-16 text-center"
      >
        <span class="flex h-14 w-14 items-center justify-center rounded-full bg-white/5 text-white/40">
          <CalendarHeart :size="26" />
        </span>
        <h2 class="mt-4 text-lg font-bold text-white">No favorites yet</h2>
        <p class="mt-1 max-w-sm text-sm text-[#9CA3AF]">
          Tap the heart on any event to save it here for easy access.
        </p>
        <button
          type="button"
          class="mt-5 rounded-full bg-[#FFA500] px-6 py-2.5 text-sm font-semibold text-black transition hover:bg-[#FFB52E]"
          @click="router.push('/events')"
        >
          Explore Events
        </button>
      </div>

      <!-- Grid -->
      <div v-else class="grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
        <EventCard v-for="event in favorites" :key="event.id" :event="event" :show-save="true" />
      </div>

      <p v-if="favorites.length" class="mt-6 flex items-center gap-1.5 text-xs text-[#9CA3AF]">
        <Heart :size="12" class="text-[#FFA500]" />
        {{ favorites.length }} saved {{ favorites.length === 1 ? "event" : "events" }}
      </p>
    </div>
  </div>
</template>