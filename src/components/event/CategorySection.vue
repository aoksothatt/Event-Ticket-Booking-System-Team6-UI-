<script setup>
import { computed, watch } from "vue";
import EventCarousel from "./EventCarousel.vue";

const props = defineProps({
  category: { type: Object, required: true },
  events: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false },
  accent: { type: Boolean, default: false },
});

const emit = defineEmits(["save", "unsave"]);

const title = computed(() => props.category?.name || "Events");

// Keep a resolved list so the carousel shows an accurate empty state.
const list = computed(() => props.events || []);
</script>

<template>
  <EventCarousel
    :title="`${title} Events`"
    :subtitle="category?.description || ''"
    :events="list"
    :loading="loading"
    :empty-text="`No events are available in this category yet.`"
    @save="emit('save', $event)"
    @unsave="emit('unsave', $event)"
  />
</template>
