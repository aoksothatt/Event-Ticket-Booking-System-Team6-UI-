<script setup>
import { computed, onMounted, ref, watch } from "vue";
import { ChevronLeft, ChevronRight } from "lucide-vue-next";
import { get } from "../api/http.js";
import EventCard from "./event/EventCard.vue";
import { useI18n } from "vue-i18n";

const { t } = useI18n();

const props = defineProps({
  currentEventId: {
    type: [Number, String],
    required: true,
  },
  apiUrl: {
    type: String,
    default: "/api",
  },
});

const events = ref([]);
const loading = ref(true);
const error = ref("");
const page = ref(0);
const PAGE_SIZE = 4;

const pageCount = computed(() =>
  Math.max(1, Math.ceil(events.value.length / PAGE_SIZE)),
);
const visibleEvents = computed(() => {
  const start = page.value * PAGE_SIZE;
  return events.value.slice(start, start + PAGE_SIZE);
});

function prevPage() {
  if (page.value > 0) page.value -= 1;
}

function nextPage() {
  if (page.value < pageCount.value - 1) page.value += 1;
}

async function fetchRelated() {
  loading.value = true;
  error.value = "";
  events.value = [];
  page.value = 0;
  try {
    const data = await get(`/events/${props.currentEventId}/related`);
    const list = data?.data ?? data;
    events.value = Array.isArray(list) ? list : [];
  } catch {
    await fetchFallback();
  } finally {
    loading.value = false;
  }
}

async function fetchFallback() {
  try {
    const data = await get("/events");
    const list = data?.data?.data ?? data ?? [];
    const current = String(props.currentEventId);
    events.value = Array.isArray(list)
      ? list.filter((e) => String(e.id) !== current)
      : [];
  } catch (e) {
    error.value = e.message || t("couldNotLoadEvents");
  }
}

watch(
  () => props.currentEventId,
  (id) => {
    if (id) fetchRelated();
  },
);

onMounted(() => fetchRelated());
</script>

<template>
  <section class="mt-10 rounded-[20px] border border-[#2A2D32] bg-[#15171B] p-5 sm:p-7">
    <div class="mb-6 flex items-center justify-between gap-4">
      <h2 class="text-[22px] font-bold tracking-tight text-white">
        {{ t("youMightAlsoLike") }}
      </h2>

      <div class="flex items-center gap-3">
        <button
          type="button"
          class="flex h-10 w-10 items-center justify-center rounded-full border border-[#30343A] bg-[#1D2025] text-[#A5A9B2] transition hover:border-[#F5A400] hover:bg-[#F5A400] hover:text-[#0D0F12] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-[#30343A] disabled:hover:bg-[#1D2025] disabled:hover:text-[#A5A9B2]"
          :disabled="page === 0"
          :aria-label="t('scrollLeft')"
          @click="prevPage"
        >
          <ChevronLeft :size="18" />
        </button>
        <button
          type="button"
          class="flex h-10 w-10 items-center justify-center rounded-full border border-[#30343A] bg-[#1D2025] text-[#A5A9B2] transition hover:border-[#F5A400] hover:bg-[#F5A400] hover:text-[#0D0F12] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-[#30343A] disabled:hover:bg-[#1D2025] disabled:hover:text-[#A5A9B2]"
          :disabled="page >= pageCount - 1"
          :aria-label="t('scrollRight')"
          @click="nextPage"
        >
          <ChevronRight :size="18" />
        </button>
      </div>
    </div>

    <div
      v-if="loading"
      class="grid animate-pulse grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4"
    >
      <div
        v-for="n in 4"
        :key="n"
        class="overflow-hidden rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#14171C]"
      >
        <div class="aspect-[3/4] rounded-t-2xl bg-slate-200 dark:bg-[#1D2229]"></div>
        <div class="space-y-2.5 p-3.5">
          <div class="h-3.5 w-3/4 rounded bg-slate-200 dark:bg-[#1D2229]"></div>
          <div class="h-2.5 w-1/2 rounded bg-slate-200 dark:bg-[#1D2229]"></div>
          <div class="h-2.5 w-2/3 rounded bg-slate-200 dark:bg-[#1D2229]"></div>
          <div class="h-3 w-1/3 rounded bg-slate-200 dark:bg-[#1D2229]"></div>
        </div>
      </div>
    </div>

    <div
      v-else-if="error"
      class="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[#2A2D32] px-6 py-10 text-center"
    >
      <p class="text-sm text-[#777C86]">{{ error }}</p>
      <button
        type="button"
        class="mt-4 inline-flex items-center gap-2 rounded-full bg-[#F5A400] px-5 py-2.5 text-sm font-bold text-[#0D0F12] transition hover:bg-[#FFB300] active:scale-[0.98]"
        @click="fetchRelated"
      >
        {{ t("retry") }}
      </button>
    </div>

    <div
      v-else-if="!events.length"
      class="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[#2A2D32] px-6 py-10 text-center"
    >
      <p class="text-sm text-[#777C86]">{{ t("noEventsAvailable") }}</p>
    </div>

    <div
      v-else
      class="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4"
    >
      <EventCard
        v-for="event in visibleEvents"
        :key="event.id"
        :event="event"
      />
    </div>
  </section>
</template>