<script setup>
import { onMounted } from "vue";
import { useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import { Heart, CalendarHeart } from "lucide-vue-next";
import EventCard from "../components/event/EventCard.vue";
import EventSkeleton from "../components/event/EventSkeleton.vue";
import { useFavorites } from "../composables/useFavorites.js";

const { t } = useI18n();
const router = useRouter();
const { favorites, loading, error, loadFavorites, retry } = useFavorites();

onMounted(loadFavorites);
</script>

<template>
  <div class="px-4 pb-20 pt-28 sm:px-6 lg:px-8">
    <div class="mx-auto w-full max-w-7xl">
      <div class="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 class="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-3xl">{{ t('favorites') }}</h1>
          <p class="mt-1 text-sm text-slate-500 dark:text-[#9CA3AF]">{{ t('favoritesDesc') }}</p>
        </div>
      </div>

      <!-- Loading -->
      <div v-if="loading">
        <EventSkeleton :count="4" />
      </div>

      <!-- Error -->
      <div
        v-else-if="error"
        class="flex flex-col items-center justify-center rounded-2xl border border-red-500/30 bg-red-500/10 dark:bg-red-500/10 px-6 py-16 text-center"
      >
        <p class="text-sm text-red-300">{{ error }}</p>
        <button
          type="button"
          class="mt-4 rounded-full bg-[#FFA500] px-5 py-2 text-sm font-semibold text-black transition hover:bg-[#FFB52E]"
          @click="retry"
        >
          {{ t('retry') }}
        </button>
      </div>

      <!-- Empty state -->
      <div
        v-else-if="!favorites.length"
        class="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 dark:border-white/10 bg-white/50 dark:bg-[#14171C]/50 px-6 py-16 text-center"
      >
        <span class="flex h-14 w-14 items-center justify-center rounded-full bg-slate-200 dark:bg-white/5 text-slate-500 dark:text-white/40">
          <CalendarHeart :size="26" />
        </span>
        <h2 class="mt-4 text-lg font-bold text-slate-900 dark:text-white">{{ t('noFavoritesYet') }}</h2>
        <p class="mt-1 max-w-sm text-sm text-slate-500 dark:text-[#9CA3AF]">
          {{ t('noFavoritesDesc') }}
        </p>
        <button
          type="button"
          class="mt-5 rounded-full bg-[#FFA500] px-6 py-2.5 text-sm font-semibold text-black transition hover:bg-[#FFB52E]"
          @click="router.push('/events')"
        >
          {{ t('exploreEvents') }}
        </button>
      </div>

      <!-- Grid -->
      <div v-else class="grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
        <EventCard v-for="event in favorites" :key="event.id" :event="event" :show-save="true" />
      </div>

      <p v-if="favorites.length" class="mt-6 flex items-center gap-1.5 text-xs text-slate-500 dark:text-[#9CA3AF]">
        <Heart :size="12" class="text-[#FFA500]" />
        {{ t('savedCount', { count: favorites.length }) }}
      </p>
    </div>
  </div>
</template>