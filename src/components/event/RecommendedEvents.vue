<script setup>
import { onMounted, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { getRecommendations } from "../../api/eventApi.js";
import EventCarousel from "./EventCarousel.vue";

const props = defineProps({
  eventId: { type: [Number, String], required: true },
});

const { t } = useI18n();

const events = ref([]);
const loading = ref(true);
const error = ref("");

async function load() {
  if (!props.eventId) return;
  loading.value = true;
  error.value = "";
  events.value = [];
  try {
    events.value = await getRecommendations(props.eventId);
  } catch (e) {
    error.value = e.response?.data?.message || e.message || t("couldNotLoadRecommendations");
  } finally {
    loading.value = false;
  }
}

onMounted(load);
watch(() => props.eventId, load);
</script>

<template>
  <!-- Loading & populated states reuse the existing carousel + card design. -->
  <EventCarousel
    v-if="loading || events.length"
    :title="t('youMightAlsoLike')"
    :subtitle="t('youMightAlsoLikeDesc')"
    :events="events"
    :loading="loading"
    :empty-text="t('noRecommendations')"
    class="mt-14"
  />

  <!-- Graceful error state with a retry action. -->
  <section
    v-else-if="error"
    class="mt-14 flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-[#14171C]/50 px-6 py-12 text-center"
  >
    <h2 class="text-lg font-bold tracking-tight text-slate-900 dark:text-white sm:text-xl">
      {{ t("youMightAlsoLike") }}
    </h2>
    <p class="mt-2 text-sm text-slate-500 dark:text-[#9CA3AF]">
      {{ error }}
    </p>
    <button
      type="button"
      class="mt-4 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-bold text-primary-contrast transition hover:bg-primary-hover active:scale-[0.98]"
      @click="load"
    >
      {{ t("retry") }}
    </button>
  </section>

  <!-- No recommendations available: show a quiet empty state. -->
  <section
    v-else
    class="mt-14 flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-[#14171C]/50 px-6 py-12 text-center"
  >
    <h2 class="text-lg font-bold tracking-tight text-slate-900 dark:text-white sm:text-xl">
      {{ t("youMightAlsoLike") }}
    </h2>
    <p class="mt-2 text-sm text-slate-500 dark:text-[#9CA3AF]">
      {{ t("noRecommendations") }}
    </p>
  </section>
</template>