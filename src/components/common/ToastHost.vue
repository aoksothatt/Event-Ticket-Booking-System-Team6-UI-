<script setup>
import { CheckCircle2, Info, AlertTriangle } from "lucide-vue-next";
import { useFavorites } from "../../composables/useFavorites.js";

const { toast } = useFavorites();

const iconMap = {
  success: CheckCircle2,
  info: Info,
  error: AlertTriangle,
};

function toastStyle(type) {
  const styles = {
    success: "border-emerald-500/50 bg-emerald-500/10 text-emerald-300",
    info: "border-sky-500/50 bg-sky-500/10 text-sky-300",
    error: "border-[#FFA500]/60 bg-[#FFA500]/10 text-[#FFA500]",
  };
  return styles[type] || styles.success;
}
</script>

<template>
  <Transition
    enter-active-class="transition duration-300 ease-out"
    enter-from-class="-translate-y-3 opacity-0"
    enter-to-class="translate-y-0 opacity-100"
    leave-active-class="transition duration-200 ease-in"
    leave-from-class="translate-y-0 opacity-100"
    leave-to-class="-translate-y-3 opacity-0"
  >
    <div
      v-if="toast"
      class="pointer-events-none fixed inset-x-0 top-4 z-[100] flex justify-center px-4"
      role="status"
      aria-live="polite"
    >
      <div
        class="pointer-events-auto flex items-center gap-2.5 rounded-full border px-4 py-2.5 text-sm font-medium shadow-lg shadow-black/40 backdrop-blur-md"
        :class="toastStyle(toast.type)"
      >
        <component :is="iconMap[toast.type] || CheckCircle2" :size="16" class="shrink-0" />
        <span>{{ toast.message }}</span>
      </div>
    </div>
  </Transition>
</template>