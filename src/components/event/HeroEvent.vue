<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { useRouter } from "vue-router";
import { Calendar, Clock, MapPin, Ticket, Heart, ChevronLeft, ChevronRight, Tag } from "lucide-vue-next";
import { coverImage, formatDate, formatTime, formatPrice, minPrice } from "../../utils/event.js";

const props = defineProps({
  events: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false },
});

const emit = defineEmits(["save", "unsave"]);

const router = useRouter();

const current = ref(0);
const paused = ref(false);
let timer = null;

const slideCount = computed(() => props.events.length);
const event = computed(() => props.events[current.value] || null);
const image = computed(() => (event.value ? coverImage(event.value) : ""));
const price = computed(() => (event.value ? minPrice(event.value) : null));
const category = computed(() => event.value?.category?.name || "");
const venue = computed(() => event.value?.venue?.name || "");

function go(next) {
  if (!slideCount.value) return;
  current.value = (next + slideCount.value) % slideCount.value;
}

function next() {
  go(current.value + 1);
}

function prev() {
  go(current.value - 1);
}

function start() {
  stop();
  if (slideCount.value > 1) {
    timer = setInterval(() => {
      if (!paused.value) next();
    }, 5000);
  }
}

function stop() {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
}

// Reset position when the events array changes.
watch(() => props.events, () => {
  current.value = 0;
  start();
});

onMounted(start);
onBeforeUnmount(stop);

function bookTicket() {
  if (event.value) router.push(`/events/${event.value.id}/booking`);
}

function viewDetails() {
  if (event.value) router.push(`/events/${event.value.id}`);
}
</script>

<template>
  <section
    class="relative min-h-[78vh] w-full overflow-hidden sm:min-h-[86vh]"
    @mouseenter="paused = true"
    @mouseleave="paused = false"
  >
    <!-- Loading state -->
    <div v-if="loading" class="relative h-[78vh] w-full animate-pulse bg-[#14171C] sm:h-[86vh]">
      <div class="flex h-full flex-col justify-end p-6 sm:p-12 lg:p-16">
        <div class="h-4 w-32 rounded bg-[#1D2229]"></div>
        <div class="mt-4 h-10 w-full max-w-xl rounded bg-[#1D2229]"></div>
        <div class="mt-3 h-4 w-64 rounded bg-[#1D2229]"></div>
        <div class="mt-8 flex gap-3">
          <div class="h-12 w-36 rounded-full bg-[#1D2229]"></div>
          <div class="h-12 w-32 rounded-full bg-[#1D2229]"></div>
        </div>
      </div>
    </div>

    <!-- Empty state -->
    <div
      v-else-if="!event"
      class="relative flex h-[80vh] w-full items-center justify-center bg-gradient-to-b from-[#14171C] to-[#0B0D10] p-6 text-center"
    >
      <div>
        <h2 class="text-xl font-bold text-white">No featured events yet</h2>
        <p class="mt-2 text-sm text-[#9CA3AF]">Check back soon for highlights.</p>
      </div>
    </div>

    <template v-else>
      <!-- Background image -->
      <transition name="hero-fade" mode="out-in">
        <img
          :key="event.id"
          v-if="image"
          :src="image"
          :alt="event.title"
          class="absolute inset-0 h-full w-full object-cover"
        />
        <div
          :key="`${event.id}-ph`"
          v-else
          class="absolute inset-0 bg-gradient-to-br from-[#1D2229] to-[#14171C]"
        ></div>
      </transition>

      <!-- Dark gradient overlay -->
      <div
        class="pointer-events-none absolute inset-0"
        :style="{
          background:
            'linear-gradient(90deg, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.6) 45%, rgba(0,0,0,0.2) 100%)',
        }"
      ></div>
      <!-- Fade bottom into page background -->
      <div
        class="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#0B0D10] to-transparent"
      ></div>

      <!-- Content -->
      <div
        class="relative z-10 flex h-full min-h-[78vh] flex-col justify-end px-5 pb-24 pt-28 sm:min-h-[86vh] sm:px-10 sm:pb-28 lg:px-16"
      >
        <div class="max-w-2xl">
          <div class="mb-4 flex items-center gap-2">
            <span class="rounded-full bg-[#FFA500] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.15em] text-black">
              Trending Event
            </span>
            <span
              v-if="category"
              class="rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-white/80 backdrop-blur-sm"
            >
              {{ category }}
            </span>
          </div>

          <h1
            class="text-3xl font-extrabold leading-tight tracking-tight text-white drop-shadow-lg sm:text-5xl lg:text-6xl"
          >
            {{ event.title }}
          </h1>

          <div class="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-white/90">
            <span class="flex items-center gap-2">
              <Calendar :size="16" class="text-[#FFA500]" />
              {{ formatDate(event.start_date) }}
            </span>
            <span class="flex items-center gap-2">
              <Clock :size="16" class="text-[#FFA500]" />
              {{ formatTime(event.start_time) }}
            </span>
            <span v-if="venue" class="flex items-center gap-2">
              <MapPin :size="16" class="text-[#FFA500]" />
              {{ venue }}
            </span>
          </div>

          <p class="mt-4 line-clamp-2 max-w-xl text-sm leading-relaxed text-white/70 sm:text-base">
            {{ event.description || 'Experience this unforgettable event.' }}
          </p>

          <div class="mt-5 flex items-center gap-4">
            <span v-if="price !== null" class="flex items-center gap-1.5 text-sm text-white/90">
              <Tag :size="15" class="text-[#FFA500]" />
              <span class="font-bold text-white">{{ formatPrice(price) }}</span>
            </span>
            <span v-else class="text-sm font-semibold text-white/80">Free</span>
          </div>

          <div class="mt-6 flex flex-wrap items-center gap-3">
            <button
              type="button"
              class="inline-flex items-center gap-2 rounded-full bg-[#FFA500] px-6 py-3 text-sm font-bold text-black shadow-lg shadow-[#FFA500]/25 transition hover:bg-[#FFB52E] active:scale-[0.98]"
              @click="bookTicket"
            >
              <Ticket :size="17" />
              Book Ticket
            </button>

            <button
              type="button"
              :class="event.saved
                ? 'bg-white text-black'
                : 'border border-white/25 bg-white/5 text-white backdrop-blur-sm hover:bg-white/10'"
              class="inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold transition active:scale-[0.98]"
              @click="event.saved ? emit('unsave', event) : emit('save', event)"
            >
              <Heart :size="16" :fill="event.saved ? 'currentColor' : 'none'" />
              {{ event.saved ? 'Saved' : 'Save' }}
            </button>

            <button
              type="button"
              class="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/5 px-5 py-3 text-sm font-semibold text-white backdrop-blur-sm transition hover:bg-white/10 active:scale-[0.98]"
              @click="viewDetails"
            >
              View Details
            </button>
          </div>
        </div>
      </div>

      <!-- Carousel controls -->
      <div
        class="absolute bottom-6 right-5 z-20 flex items-center gap-3 sm:right-10"
      >
        <button
          type="button"
          class="flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-black/30 text-white backdrop-blur transition hover:bg-black/60"
          aria-label="Previous featured event"
          @click="prev"
        >
          <ChevronLeft :size="20" />
        </button>
        <button
          type="button"
          class="flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-black/30 text-white backdrop-blur transition hover:bg-black/60"
          aria-label="Next featured event"
          @click="next"
        >
          <ChevronRight :size="20" />
        </button>
      </div>

      <!-- Pagination indicators -->
      <div class="absolute bottom-7 left-5 z-20 flex items-center gap-2 sm:left-10">
        <button
          v-for="(item, index) in slideCount"
          :key="item.id"
          type="button"
          :aria-label="`Go to slide ${index + 1}`"
          class="h-1.5 rounded-full transition-all duration-300"
          :class="index === current ? 'w-7 bg-[#FFA500]' : 'w-3 bg-white/40 hover:bg-white/60'"
          @click="go(index)"
        ></button>
      </div>
    </template>
  </section>
</template>

<style scoped>
.hero-fade-enter-active,
.hero-fade-leave-active {
  transition: opacity 0.6s ease;
}
.hero-fade-enter-from,
.hero-fade-leave-to {
  opacity: 0;
}
</style>
