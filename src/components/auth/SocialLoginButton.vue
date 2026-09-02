<script setup>
defineProps({
  label: { type: String, default: "Sign in with Google" },
});

const emit = defineEmits(["click"]);
</script>

<template>
  <button
    type="button"
    class="relative flex h-11 w-full items-center rounded-[6px] border border-[#454545] bg-[#303030] text-sm font-medium text-[#E0E0E0] transition hover:border-[#5A5A5A] hover:bg-[#383838] active:scale-[0.99]"
    @click="emit('click')"
  >
    <span class="w-full text-center">{{ label }}</span>
    <span class="absolute right-4 top-1/2 -translate-y-1/2">
      <svg class="h-5 w-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z" />
        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z" />
        <path fill="#FBBC05" d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84z" />
        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15A10.97 10.97 0 0 0 12 1 11 11 0 0 0 2.18 7.06l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z" />
      </svg>
    </span>
  </button>
</template>