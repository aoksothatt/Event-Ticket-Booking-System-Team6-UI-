<script setup>
const props = defineProps({
  id: { type: String, required: true },
  label: { type: String, required: true },
  modelValue: { type: [String, Number], default: "" },
  type: { type: String, default: "text" },
  placeholder: { type: String, default: "" },
  hint: { type: String, default: "" },
  error: { type: String, default: "" },
  disabled: { type: Boolean, default: false },
  min: { type: Number, default: undefined },
  max: { type: Number, default: undefined },
  step: { type: Number, default: undefined },
});

const emit = defineEmits(["update:modelValue"]);

function onInput(e) {
  const raw = e.target.value;
  if (props.type === "number") {
    emit("update:modelValue", raw === "" ? "" : Number(raw));
  } else {
    emit("update:modelValue", raw);
  }
}
</script>

<template>
  <div>
    <label :for="id" class="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-300">
      {{ label }}
    </label>
    <input
      :id="id"
      :type="type"
      :value="modelValue"
      :placeholder="placeholder"
      :disabled="disabled"
      :min="min"
      :max="max"
      :step="step"
      @input="onInput"
      class="w-full rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 px-3.5 py-2.5 text-sm text-slate-900 dark:text-slate-100 outline-none transition-colors focus:bg-white dark:focus:bg-slate-600 focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-60"
      :class="error ? 'border-rose-400 focus:border-rose-400 focus:ring-rose-500/20' : ''"
    />
    <p v-if="error" class="mt-1 text-xs text-rose-500">{{ error }}</p>
    <p v-else-if="hint" class="mt-1 text-xs text-slate-400 dark:text-slate-500">{{ hint }}</p>
  </div>
</template>