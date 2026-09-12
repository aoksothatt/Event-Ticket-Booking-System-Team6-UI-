<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from "vue";
import { useI18n } from "vue-i18n";
import { Globe, ChevronDown, Check } from "lucide-vue-next";
import { setLocale as setAppLocale } from "../../locales/i18n.js";

const { locale } = useI18n();
const open = ref(false);
const rootEl = ref(null);

const languages = [
  { code: "en", label: "English", badge: "EN" },
  { code: "km", label: "ភាសាខ្មែរ", badge: "KH" },
];

const current = computed(() =>
  languages.find((l) => l.code === locale.value) || languages[0]
);

function switchLang(code) {
  setAppLocale(code);
  open.value = false;
}

function toggle() {
  open.value = !open.value;
}

// Close when clicking outside the component.
function onClickOutside(event) {
  if (open.value && rootEl.value && !rootEl.value.contains(event.target)) {
    open.value = false;
  }
}

onMounted(() => document.addEventListener("click", onClickOutside));
onBeforeUnmount(() => document.removeEventListener("click", onClickOutside));
</script>

<template>
  <div ref="rootEl" class="relative">
    <button
      type="button"
      class="flex h-9 items-center gap-1.5 rounded-full border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-white/5 px-3 text-xs font-semibold text-slate-600 dark:text-white/80 transition hover:border-[#FFA500]/40 hover:bg-slate-200 dark:hover:bg-white/10 hover:text-slate-900 dark:hover:text-white"
      :aria-label="locale === 'en' ? 'Language: English' : 'ភាសា: ខ្មែរ'"
      aria-haspopup="listbox"
      :aria-expanded="open"
      @click="toggle"
    >
      <Globe :size="16" :stroke-width="2" class="text-slate-600 dark:text-white/70" />
      <span class="hidden sm:inline">{{ current.label }}</span>
      <ChevronDown
        :size="14"
        class="text-slate-400 transition-transform dark:text-white/40"
        :class="open ? 'rotate-180' : ''"
      />
    </button>

    <transition
      enter-active-class="transition duration-150 ease-out"
      enter-from-class="opacity-0 scale-95 -translate-y-1"
      enter-to-class="opacity-100 scale-100 translate-y-0"
      leave-active-class="transition duration-100 ease-in"
      leave-from-class="opacity-100 scale-100"
      leave-to-class="opacity-0 scale-95"
    >
      <div
        v-if="open"
        role="listbox"
        class="absolute right-0 top-full z-50 mt-1 w-40 overflow-hidden rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#162438] py-1.5 shadow-2xl shadow-black/20 dark:shadow-black/40"
      >
        <button
          v-for="lang in languages"
          :key="lang.code"
          type="button"
          role="option"
          :aria-selected="locale === lang.code"
          class="flex w-full items-center gap-2 px-3 py-2 text-xs font-medium transition hover:bg-slate-100 dark:hover:bg-white/5"
          :class="locale === lang.code ? 'text-[#FFA500]' : 'text-slate-600 dark:text-white/70 hover:text-slate-900 dark:hover:text-white'"
          @click="switchLang(lang.code)"
        >
          <span
            class="flex h-5 w-6 items-center justify-center rounded text-[9px] font-bold tracking-wide text-white"
            :class="lang.code === 'en' ? 'bg-[#FFA500]' : 'bg-blue-600'"
          >
            {{ lang.badge }}
          </span>
          <span>{{ lang.label }}</span>
          <Check
            v-if="locale === lang.code"
            :size="14"
            class="ml-auto text-[#FFA500]"
          />
        </button>
      </div>
    </transition>
  </div>
</template>