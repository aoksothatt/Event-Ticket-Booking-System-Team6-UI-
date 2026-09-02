<script setup>
import { Ticket } from "lucide-vue-next";

defineProps({
  size: { type: Number, default: 40 },
});
</script>

<template>
  <RouterLink to="/" class="inline-flex items-center gap-2.5 w-fit">
    <span
      class="flex items-center justify-center rounded-xl border border-[#FFA500]/30 bg-[#FFA500]/10 text-[#FFA500]"
      :style="{ width: `${size + 8}px`, height: `${size + 8}px` }"
    >
      <Ticket :size="size" stroke-width="1.8" />
    </span>
    <span class="text-2xl font-extrabold tracking-tight text-white">BILIT</span>
  </RouterLink>
</template>