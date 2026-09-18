<script setup>
import { computed } from "vue";

const props = defineProps({
  label: { type: String, required: true },
  description: { type: String, default: "" },
  modelValue: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
});

const emit = defineEmits(["update:modelValue", "change"]);

const on = computed(() => Boolean(props.modelValue));

function toggle() {
  if (props.disabled) return;
  const next = !on.value;
  emit("update:modelValue", next);
  emit("change", next);
}
</script>

<template>
  <div class="flex items-start justify-between gap-4 py-3 first:pt-0 last:pb-0">
    <div>
      <p class="text-sm font-semibold text-slate-900 dark:text-white">{{ label }}</p>
      <p v-if="description" class="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{{ description }}</p>
    </div>
    <button
      type="button"
      role="switch"
      :aria-checked="on"
      :disabled="disabled"
      @click="toggle"
      class="relative h-6 w-11 shrink-0 cursor-pointer rounded-full transition-colors disabled:cursor-not-allowed disabled:opacity-60"
      :class="on ? 'bg-primary' : 'bg-slate-200 dark:bg-slate-600'"
    >
      <span
        class="block h-5 w-5 rounded-full bg-white dark:bg-slate-100 shadow-sm transition-transform"
        :class="on ? 'translate-x-5' : 'translate-x-0.5'"
      />
    </button>
  </div>
</template>