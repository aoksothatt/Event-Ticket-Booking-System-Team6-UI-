<script setup>
import { computed, watch } from "vue";
import EventCarousel from "./EventCarousel.vue";
import { useI18n } from "vue-i18n";

const { t } = useI18n();

const props = defineProps({
  category: { type: Object, required: true },
  events: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false },
  accent: { type: Boolean, default: false },
});

const title = computed(() => props.category?.name || t('events'));

// Keep a resolved list so the carousel shows an accurate empty state.
const list = computed(() => props.events || []);
</script>

<template>
  <EventCarousel
    :title="t('categoryEventsTitle', { category: title })"
    :subtitle="category?.description || ''"
    :events="list"
    :loading="loading"
    :empty-text="t('noEventsInCategory')"
  />
</template>
