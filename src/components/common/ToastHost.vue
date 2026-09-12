<script setup>
import { CheckCircle2, Info, AlertTriangle, X } from "lucide-vue-next";
import { useToast } from "../../composables/useToast.js";
import { useI18n } from "vue-i18n";

const { t } = useI18n();
const { toasts, remove } = useToast();

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
  <div
    class="pointer-events-none fixed inset-x-0 top-4 z-[100] flex flex-col items-center gap-2 px-4"
    role="status"
    aria-live="polite"
  >
    <transition-group
      enter-active-class="transition duration-300 ease-out"
      enter-from-class="-translate-y-3 opacity-0"
      enter-to-class="translate-y-0 opacity-100"
      leave-active-class="transition duration-200 ease-in"
      leave-from-class="translate-y-0 opacity-100"
      leave-to-class="-translate-y-3 opacity-0"
      tag="div"
      class="flex flex-col items-center gap-2"
    >
      <div
        v-for="entry in toasts"
        :key="entry.id"
        class="pointer-events-auto flex items-center gap-2.5 rounded-full border px-4 py-2.5 text-sm font-medium shadow-lg shadow-black/40 backdrop-blur-md"
        :class="toastStyle(entry.type)"
      >
        <component :is="iconMap[entry.type] || CheckCircle2" :size="16" class="shrink-0" />
        <span>{{ entry.message }}</span>
        <button
          type="button"
          :aria-label="t('dismissNotification', { message: entry.message })"
          class="ml-1 rounded-full p-0.5 text-inherit opacity-60 transition hover:bg-white/10 hover:opacity-100"
          @click="remove(entry.id)"
        >
          <X :size="14" />
        </button>
      </div>
    </transition-group>
  </div>
</template>