<script setup>
import { computed } from "vue";
import { useRouter } from "vue-router";
import { Calendar, Clock, MapPin, Ticket, Heart } from "lucide-vue-next";
import { coverImage, formatDate, formatTime, formatPrice, minPrice } from "../../utils/event.js";
import { useFavorites } from "../../composables/useFavorites.js";

const props = defineProps({
  event: { type: Object, required: true },
  showSave: { type: Boolean, default: true },
  showBadges: { type: Boolean, default: true },
});

const router = useRouter();
const { isFavorite, toggle } = useFavorites();

const image = computed(() => coverImage(props.event));
const price = computed(() => minPrice(props.event));
const category = computed(() => props.event?.category?.name || "");
const venue = computed(() => props.event?.venue?.name || "");
const date = computed(() => {
  const d = formatDate(props.event?.start_date);
  const t = formatTime(props.event?.start_time);
  return t ? `${d} • ${t}` : d;
});
const saved = computed(() => isFavorite(props.event));

// Pull trending/featured flags from any of the shapes the backend may use.
const trending = computed(() => Boolean(props.event?.trending || props.event?.is_trending));
const featured = computed(() => Boolean(props.event?.featured || props.event?.is_featured));

function open() {
  router.push(`/events/${props.event.id}`);
}

function goToBooking() {
  router.push(`/events/${props.event.id}/booking`);
}

function onToggleFavorite() {
  toggle(props.event);
}
</script>

<template>
  <article
    class="group relative w-[240px] shrink-0 cursor-pointer overflow-hidden rounded-2xl bg-[#14171C] transition-all duration-300 hover:-translate-y-1.5 hover:shadow-2xl hover:shadow-black/60 sm:w-[260px]"
    tabindex="0"
    @click="open"
    @keydown.enter="open"
  >
    <!-- Cover -->
    <div class="relative aspect-[3/4] overflow-hidden">
      <img
        v-if="image"
        :src="image"
        :alt="event.title"
        loading="lazy"
        class="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
      />
      <div v-else class="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#1D2229] to-[#14171C]">
        <span class="text-xs font-medium uppercase tracking-[0.2em] text-white/30">No image</span>
      </div>

      <!-- Dark overlay for readability -->
      <div class="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-black/30"></div>

      <!-- Badges -->
      <div v-if="showBadges" class="absolute left-3 top-3 flex flex-col gap-1.5">
        <span
          v-if="trending"
          class="rounded-full bg-[#FFA500] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-black shadow-md shadow-black/30"
        >
          Trending
        </span>
        <span
          v-else-if="featured"
          class="rounded-full bg-white/90 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-black"
        >
          Featured
        </span>
      </div>

      <!-- Save button -->
      <button
        v-if="showSave"
        type="button"
        class="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-black/40 text-white/70 backdrop-blur transition hover:bg-black/70 hover:text-white"
        :aria-label="saved ? 'Remove from favorites' : 'Add to favorites'"
        @click.stop="onToggleFavorite"
      >
        <Heart :size="15" :fill="saved ? 'currentColor' : 'none'" />
      </button>

      <!-- Category pill at bottom of image -->
      <span
        v-if="category"
        class="absolute bottom-3 left-3 rounded-md bg-black/50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[#FFA500] backdrop-blur-sm"
      >
        {{ category }}
      </span>
    </div>

    <!-- Body -->
    <div class="flex flex-col gap-1.5 p-3.5">
      <h3 class="line-clamp-1 text-sm font-semibold text-white transition-colors group-hover:text-[#FFA500]">
        {{ event.title }}
      </h3>

      <p v-if="date" class="flex items-center gap-1.5 text-[11px] text-[#9CA3AF]">
        <Calendar :size="12" class="shrink-0" />
        <span class="truncate">{{ date }}</span>
      </p>

      <p v-if="venue" class="flex items-center gap-1.5 text-[11px] text-[#9CA3AF]">
        <MapPin :size="12" class="shrink-0" />
        <span class="truncate">{{ venue }}</span>
      </p>

      <div class="mt-1.5 flex items-center justify-between border-t border-white/5 pt-2.5">
        <p
          :class="price !== null && price > 0
            ? 'rounded-md bg-[#FFA500]/10 px-2 py-1 text-sm font-bold text-[#FFA500]'
            : 'rounded-md bg-white/5 px-2 py-1 text-[11px] font-semibold text-white/70'"
        >
          <template v-if="price !== null && price > 0">From {{ formatPrice(price) }}</template>
          <template v-else>Free Entry</template>
        </p>

        <button
          type="button"
          class="flex items-center gap-1 rounded-md bg-white/5 px-2 py-1 text-[10px] font-semibold text-white/70 transition-colors hover:bg-[#FFA500] hover:text-black"
          @click.stop="goToBooking"
        >
          <Ticket :size="11" />
          Book
        </button>
      </div>
    </div>
  </article>
</template>
