<script setup>
import { ref } from "vue";
import { ChevronLeft, ChevronRight } from "lucide-vue-next";
import EventCard from "./EventCard.vue";
import EventSkeleton from "./EventSkeleton.vue";

const props = defineProps({
  title: { type: String, default: "" },
  subtitle: { type: String, default: "" },
  events: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false },
  emptyText: { type: String, default: "No events are available in this category yet." },
  minCards: { type: Number, default: 4 },
});

const track = ref(null);

function scrollByCards(direction) {
  const el = track.value;
  if (!el) return;
  const card = el.querySelector("article");
  const width = card ? card.offsetWidth + 16 : 280;
  el.scrollBy({ left: direction * width, behavior: "smooth" });
}

function hasRoomToScroll() {
  const el = track.value;
  if (!el) return false;
  return el.scrollWidth > el.clientWidth + 8;
}
</script>

<template>
  <section>
    <div class="mb-4 flex items-end justify-between gap-4">
      <div class="min-w-0">
        <h2
          class="truncate text-lg font-bold tracking-tight text-white sm:text-xl"
        >
          {{ title }}
        </h2>
        <p v-if="subtitle" class="mt-0.5 truncate text-xs text-[#9CA3AF]">
          {{ subtitle }}
        </p>
      </div>

      <div class="hidden shrink-0 items-center gap-2 sm:flex">
        <button
          type="button"
          class="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/70 transition hover:border-[#FFA500]/50 hover:bg-[#FFA500]/10 hover:text-white"
          aria-label="Scroll left"
          @click="scrollByCards(-1)"
        >
          <ChevronLeft :size="18" />
        </button>
        <button
          type="button"
          class="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/70 transition hover:border-[#FFA500]/50 hover:bg-[#FFA500]/10 hover:text-white"
          aria-label="Scroll right"
          @click="scrollByCards(1)"
        >
          <ChevronRight :size="18" />
        </button>
      </div>
    </div>

    <!-- Loading skeletons -->
    <EventSkeleton v-if="loading" :count="Math.max(2, Math.min(minCards, events.length || 4))" />

    <!-- Empty state (do not render a broken empty carousel) -->
    <div
      v-else-if="!events.length"
      class="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 bg-[#14171C]/50 px-6 py-12 text-center"
    >
      <p class="text-sm text-[#9CA3AF]">{{ emptyText }}</p>
    </div>

    <!-- Carousel -->
    <div
      v-else
      ref="track"
      class="-mx-1 flex snap-x snap-mandatory gap-4 overflow-x-auto px-1 pb-2 [scrollbar-width:thin] [scrollbar-color:#2a2f37_transparent] [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-[#2a2f37]"
    >
      <EventCard
        v-for="event in events"
        :key="event.id"
        :event="event"
        class="snap-start"
      />
    </div>
  </section>
</template>
