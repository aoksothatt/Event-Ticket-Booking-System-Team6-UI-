<script setup>
import { computed } from "vue";

const props = defineProps({
  id: { type: String, required: true },
  label: { type: String, required: true },
  modelValue: { type: [String, Number], default: "" },
  options: { type: Array, default: () => [] },
  hint: { type: String, default: "" },
  error: { type: String, default: "" },
  disabled: { type: Boolean, default: false },
});

const emit = defineEmits(["update:modelValue"]);

const normalizedOptions = computed(() =>
  props.options.map((o) => (typeof o === "object" ? o : { value: o, label: o }))
);
</script>

<template>
  <div>
    <label :for="id" class="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-300">
      {{ label }}
    </label>
    <select
      :id="id"
      :value="modelValue"
      :disabled="disabled"
      @change="emit('update:modelValue', $event.target.value)"
      class="w-full cursor-pointer rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 px-3.5 py-2.5 text-sm text-slate-900 dark:text-slate-100 outline-none transition-colors focus:bg-white dark:focus:bg-slate-600 focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-60"
      :class="error ? 'border-rose-400 focus:border-rose-400 focus:ring-rose-500/20' : ''"
    >
      <option v-for="opt in normalizedOptions" :key="String(opt.value)" :value="opt.value">
        {{ opt.label }}
      </option>
    </select>
    <p v-if="error" class="mt-1 text-xs text-rose-500">{{ error }}</p>
    <p v-else-if="hint" class="mt-1 text-xs text-slate-400 dark:text-slate-500">{{ hint }}</p>
  </div>
</template>