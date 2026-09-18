<script setup>
import { computed } from "vue";
import { useRouter } from "vue-router";
import { Calendar, Clock, MapPin, Ticket, Heart, ShoppingCart } from "lucide-vue-next";
import { coverImage, formatDate, formatTime, formatPrice, minPrice } from "../../utils/event.js";
import { useFavorites } from "../../composables/useFavorites.js";
import { useI18n } from "vue-i18n";

const { t } = useI18n();

const props = defineProps({
  event: { type: Object, required: true },
  showSave: { type: Boolean, default: true },
  showBadges: { type: Boolean, default: true },
});

// Events admin-flagged as upcoming get the subtle ticket/cart treatment.
const isTicket = computed(() => Boolean(props.event?.is_upcoming));

const router = useRouter();
const { isFavorite, toggle } = useFavorites();

const image = computed(() => coverImage(props.event));
const price = computed(() => minPrice(props.event));
const category = computed(() => props.event?.category?.name || "");
const venue = computed(() => props.event?.venue?.name || "");
const date = computed(() => {
  const d = formatDate(props.event?.start_date);
  const timeStr = formatTime(props.event?.start_time);
  return timeStr ? `${d} • ${timeStr}` : d;
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
    :class="[
      'group relative w-[240px] shrink-0 cursor-pointer overflow-hidden rounded-2xl border bg-white dark:bg-[#14171C] transition-all duration-300 hover:-translate-y-1.5 sm:w-[260px]',
      isTicket
        ? 'border-[#FFA500]/40 dark:border-[#FFA500]/20 hover:border-[#FFA500]/60 hover:shadow-xl hover:shadow-[#FFA500]/10 dark:hover:shadow-2xl dark:hover:shadow-black/60'
        : 'border-slate-200 dark:border-white/10 hover:border-[#FFA500]/30 dark:hover:shadow-2xl dark:hover:shadow-black/60',
    ]"
    tabindex="0"
    @click="open"
    @keydown.enter="open"
  >
    <!-- Cover -->
    <div class="relative aspect-[3/4]">
      <img
        v-if="image"
        :src="image"
        :alt="event.title"
        loading="lazy"
        class="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
      />
      <div v-else class="flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-200 to-white dark:from-[#1D2229] dark:to-[#14171C]">
        <span class="text-xs font-medium uppercase tracking-[0.2em] text-slate-500 dark:text-white/30">{{ t('noImage2') }}</span>
      </div>

      <!-- Dark overlay for readability -->
      <div class="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-black/30"></div>

      <!-- Badges -->
      <div v-if="showBadges" class="absolute left-3 top-3 flex flex-col gap-1.5">
        <span
          v-if="trending"
          class="rounded-full bg-[#FFA500] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-black shadow-md shadow-black/30"
        >
          {{ t('trending') }}
        </span>
        <span
          v-else-if="featured"
          class="rounded-full bg-white/90 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-black"
        >
          {{ t('featured') }}
        </span>
      </div>

      <!-- Save button -->
      <button
        v-if="showSave"
        type="button"
        class="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-black/40 text-white/70 backdrop-blur transition hover:bg-black/70 hover:text-white"
        :aria-label="saved ? t('removeFromFavorites') : t('addToFavorites')"
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

      <!-- Upcoming ticket/cart chip (only for upcoming events) -->
      <div
        v-if="isTicket"
        class="pointer-events-none absolute bottom-3 right-3 flex items-center gap-1 rounded-full border border-[#FFA500]/40 bg-black/50 px-2 py-0.5 text-[#FFA500] backdrop-blur-sm"
      >
        <ShoppingCart
          :size="11"
          class="ticket-cart-icon transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:scale-110"
        />
        <span class="text-[9px] font-bold uppercase tracking-wider">{{ t('upcomingHeader') }}</span>
      </div>

      <!-- Ticket perforation separator (only for upcoming events) -->
      <div
        v-if="isTicket"
        class="pointer-events-none absolute inset-x-0 -bottom-[6px] z-10 flex items-center justify-between px-2"
      >
        <span class="h-3 w-3 shrink-0 rounded-full border border-[#FFA500]/30 bg-white dark:bg-[#14171C]"></span>
        <span class="mx-1 h-0 flex-1 border-t border-dashed border-[#FFA500]/50"></span>
        <span class="h-3 w-3 shrink-0 rounded-full border border-[#FFA500]/30 bg-white dark:bg-[#14171C]"></span>
      </div>
    </div>

    <!-- Body -->
    <div class="flex flex-col gap-1.5 p-3.5">
      <h3 class="line-clamp-1 text-sm font-semibold text-slate-900 dark:text-white transition-colors group-hover:text-[#FFA500]">
        {{ event.title }}
      </h3>

      <p v-if="date" class="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-[#9CA3AF]">
        <Calendar :size="12" class="shrink-0" />
        <span class="truncate">{{ date }}</span>
      </p>

      <p v-if="venue" class="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-[#9CA3AF]">
        <MapPin :size="12" class="shrink-0" />
        <span class="truncate">{{ venue }}</span>
      </p>

      <!-- Price + Book / ticket purchase area -->
      <div
        class="mt-1.5 flex items-center justify-between pt-2.5"
        :class="isTicket
          ? 'border-t border-dashed border-[#FFA500]/40'
          : 'border-t border-slate-200 dark:border-white/5'"
      >
        <p
          :class="price !== null && price > 0
            ? 'rounded-md bg-[#FFA500]/10 px-2 py-1 text-sm font-bold text-[#FFA500]'
            : 'rounded-md bg-slate-100 dark:bg-white/5 px-2 py-1 text-[11px] font-semibold text-slate-600 dark:text-white/70'"
        >
          <span class="flex items-center gap-1">
            <Ticket v-if="isTicket" :size="11" />
            <template v-if="price !== null && price > 0">{{ t('fromPrice') }} {{ formatPrice(price) }}</template>
            <template v-else>{{ t('freeEntry') }}</template>
          </span>
        </p>

        <button
          type="button"
          :class="[
            'flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-semibold transition',
            isTicket
              ? 'bg-[#FFA500] font-bold text-black shadow-sm shadow-[#FFA500]/25 hover:bg-[#FFB52E] active:scale-[0.97]'
              : 'bg-slate-100 hover:bg-[#FFA500] hover:text-black dark:bg-white/5 dark:text-white/70',
          ]"
          @click.stop="goToBooking"
        >
          <ShoppingCart
            v-if="isTicket"
            :size="11"
            class="ticket-cart-icon transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
          />
          <Ticket v-else :size="11" />
          <span class="group-hover:translate-x-px transition-transform duration-300">{{ t('bookSingle') }}</span>
        </button>
      </div>
    </div>
  </article>
</template>