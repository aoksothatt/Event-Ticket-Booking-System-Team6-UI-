<script setup>
defineProps({
  id: { type: String, required: true },
  label: { type: String, required: true },
  type: { type: String, default: "text" },
  placeholder: { type: String, default: "" },
  autocomplete: { type: String, default: undefined },
  icon: { type: Object, default: null },
  error: { type: String, default: "" },
});

const model = defineModel({ type: String, default: "" });
</script>

<template>
  <div class="space-y-1.5">
    <label :for="id" class="block text-[13px] font-medium text-[#D9D9D9]">
      {{ label }}
    </label>
    <div class="relative">
      <input
        :id="id"
        v-model="model"
        :type="type"
        :placeholder="placeholder"
        :autocomplete="autocomplete"
        class="h-11 w-full rounded-[6px] border bg-[#303030] py-2.5 pl-4 pr-11 text-sm text-white outline-none transition placeholder:text-[#6E6E6E] focus:ring-2"
        :class="
          error
            ? 'border-red-500/60 focus:border-red-500 focus:ring-red-500/10'
            : 'border-[#454545] focus:border-[#FFA500] focus:ring-[#FFA500]/20'
        "
      />
      <span
        v-if="icon"
        class="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[#8A8A8A]"
      >
        <component :is="icon" class="h-[18px] w-[18px]" />
      </span>
      <slot name="trailing" />
    </div>
    <p v-if="error" class="text-xs text-red-400">{{ error }}</p>
  </div>
</template>