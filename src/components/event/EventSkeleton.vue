<script setup>
defineProps({
  count: { type: Number, default: 4 },
});
</script>

<template>
  <div class="flex gap-4 overflow-hidden">
    <div
      v-for="n in count"
      :key="n"
      class="w-[240px] shrink-0 animate-pulse rounded-2xl bg-[#14171C] p-0 sm:w-[260px]"
    >
      <div class="aspect-[3/4] rounded-t-2xl bg-[#1D2229]"></div>
      <div class="space-y-2.5 p-3.5">
        <div class="h-3.5 w-3/4 rounded bg-[#1D2229]"></div>
        <div class="h-2.5 w-1/2 rounded bg-[#1D2229]"></div>
        <div class="h-2.5 w-2/3 rounded bg-[#1D2229]"></div>
        <div class="h-3 w-1/3 rounded bg-[#1D2229]"></div>
      </div>
    </div>
  </div>
</template>
