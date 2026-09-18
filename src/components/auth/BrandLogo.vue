<script setup>
import { Ticket } from "lucide-vue-next";
import { useSettingsStore } from "../../stores/settings.js";

defineProps({
  size: { type: Number, default: 40 },
});

const settings = useSettingsStore();
</script>

<template>
  <RouterLink to="/" class="inline-flex items-center gap-2.5 w-fit">
    <span
      class="flex items-center justify-center rounded-xl border border-primary/30 bg-primary/10 text-primary"
      :style="{ width: `${size + 8}px`, height: `${size + 8}px` }"
    >
      <Ticket :size="size" stroke-width="1.8" />
    </span>
    <span class="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">{{ settings.platformName }}</span>
  </RouterLink>
</template>