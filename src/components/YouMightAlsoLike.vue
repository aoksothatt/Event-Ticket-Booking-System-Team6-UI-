<script setup>
import { ref, watch, onMounted } from "vue";
import { useRouter } from "vue-router";
import { ChevronLeft, ChevronRight, Play } from "lucide-vue-next";
import { get } from "../api/http.js";
import { coverImage, formatPrice, minPrice } from "../utils/event.js";
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

const router = useRouter();
const track = ref(null);
const events = ref([]);
const loading = ref(true);
const error = ref("");

async function fetchRelated() {
  loading.value = true;
  error.value = "";
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

function scrollLeft() {
  const el = track.value;
  if (!el) return;
  const card = el.querySelector("article");
  const width = card ? card.offsetWidth + 16 : 280;
  el.scrollBy({ left: -width, behavior: "smooth" });
}

function scrollRight() {
  const el = track.value;
  if (!el) return;
  const card = el.querySelector("article");
  const width = card ? card.offsetWidth + 16 : 280;
  el.scrollBy({ left: width, behavior: "smooth" });
}

function goToEvent(item) {
  router.push(`/events/${item.id}`);
}

watch(() => props.currentEventId, (id) => {
  if (id) fetchRelated();
});

onMounted(() => fetchRelated());
</script>

<template>
  <section class="bg-[#18181b] rounded-2xl border border-white/10 p-5 sm:p-6">
    <div class="mb-4 flex items-center justify-between gap-4">
      <h2 class="text-base font-bold tracking-tight text-white sm:text-lg">
        {{ t('youMightAlsoLike') }}
      </h2>
      <div class="flex items-center gap-2">
        <button
          type="button"
          class="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/70 transition hover:border-[#FFA500]/50 hover:bg-[#FFA500]/10 hover:text-white"
          :aria-label="t('scrollLeft')"
          @click="scrollLeft"
        >
          <ChevronLeft :size="16" />
        </button>
        <button
          type="button"
          class="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/70 transition hover:border-[#FFA500]/50 hover:bg-[#FFA500]/10 hover:text-white"
          :aria-label="t('scrollRight')"
          @click="scrollRight"
        >
          <ChevronRight :size="16" />
        </button>
      </div>
    </div>
    <div v-if="loading" class="flex gap-4 overflow-hidden">
      <div
        v-for="n in 4"
        :key="n"
        class="h-48 w-[140px] shrink-0 animate-pulse rounded-xl bg-white/10"
      ></div>
    </div>
    <div
      v-else-if="error"
      class="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-6 text-center text-red-300 text-sm"
    >
      {{ error }}
    </div>
    <div
      v-else-if="!events.length"
      class="flex flex-col items-center justify-center rounded-xl border border-dashed border-white/10 bg-white/5 px-6 py-10 text-center"
    >
      <p class="text-sm text-white/40">{{ t('noEventsAvailable') }}</p>
    </div>
    <div
      v-else
      ref="track"
      class="-mx-1 flex snap-x snap-mandatory gap-4 overflow-x-auto px-1 pb-2 [scrollbar-width:thin] [scrollbar-color:#2a2f37_transparent] dark:[scrollbar-color:#2a2f37_transparent] [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-[#2a2f37]"
    >
      <article
        v-for="event in events"
        :key="event.id"
        class="group relative shrink-0 cursor-pointer snap-start overflow-hidden rounded-xl border border-white/10 bg-[#18181b] transition-all duration-300 hover:-translate-y-1 hover:border-[#FFA500]/30 w-[150px] sm:w-[170px]"
        @click="goToEvent(event)"
      >
        <div class="relative aspect-[2/3] overflow-hidden">
          <img
            v-if="coverImage(event)"
            :src="coverImage(event)"
            :alt="event.title"
            loading="lazy"
            class="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
          <div
            v-else
            class="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#2a2f37] to-[#18181b]"
          >
            <span class="text-xs font-medium uppercase tracking-[0.2em] text-white/20">
              {{ t('noImage2') }}
            </span>
          </div>
          <div
            v-if="event.has_trailer || event.trailer_url"
            class="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          >
            <div class="flex h-12 w-12 items-center justify-center rounded-full bg-[#FFA500]/90 text-black shadow-lg">
              <Play :size="20" fill="currentColor" />
            </div>
          </div>
          <span
            v-if="event.category?.name"
            class="absolute bottom-2 left-2 rounded bg-black/50 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-[#FFA500] backdrop-blur-sm"
          >
            {{ event.category.name }}
          </span>
        </div>
        <div class="p-2.5">
          <p class="line-clamp-1 text-xs font-semibold text-white transition-colors group-hover:text-[#FFA500]">
            {{ event.title }}
          </p>
          <p class="mt-0.5 text-[11px] font-bold text-[#FFA500]">
            <template v-if="minPrice(event) !== null && minPrice(event) > 0">
              {{ t('fromPrice') }} {{ formatPrice(minPrice(event)) }}
            </template>
            <template v-else>
              {{ t('freeEntry') }}
            </template>
          </p>
        </div>
      </article>
    </div>
  </section>
</template>