<script setup>
defineProps({
  categories: { type: Array, default: () => [] },
  selectedId: { type: [Number, String, null], default: null },
});

const emit = defineEmits(["select"]);
</script>

<template>
  <div class="flex gap-2.5 overflow-x-auto pb-1 [scrollbar-width:thin]">
    <button
      type="button"
      :class="!selectedId
        ? 'bg-[#FFA500] text-black shadow-md shadow-[#FFA500]/20'
        : 'border border-white/10 bg-[#14171C] text-white/70 hover:bg-[#1D2229] hover:text-white'"
      class="shrink-0 rounded-full px-4 py-2 text-sm font-medium transition"
      @click="emit('select', null)"
    >
      All
    </button>

    <button
      v-for="category in categories"
      :key="category.id"
      type="button"
      :class="String(category.id) === String(selectedId)
        ? 'bg-[#FFA500] text-black shadow-md shadow-[#FFA500]/20'
        : 'border border-white/10 bg-[#14171C] text-white/70 hover:bg-[#1D2229] hover:text-white'"
      class="shrink-0 rounded-full px-4 py-2 text-sm font-medium transition"
      @click="emit('select', category.id)"
    >
      {{ category.name }}
    </button>
  </div>
</template>
