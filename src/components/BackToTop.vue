<script setup>
import { ref, onMounted, onBeforeUnmount } from "vue";
import { ArrowUp } from "lucide-vue-next";

const showBackToTop = ref(false);
const SCROLL_THRESHOLD = 300;

function onScroll() {
  showBackToTop.value = window.scrollY > SCROLL_THRESHOLD;
}

function backToTop() {
  window.scrollTo({ top: 0, behavior: "smooth" });
}

onMounted(() => {
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });
});

onBeforeUnmount(() => {
  window.removeEventListener("scroll", onScroll);
});
</script>

<template>
  <Transition
    enter-active-class="transition-all duration-200 ease-out"
    enter-from-class="translate-y-3 opacity-0"
    enter-to-class="translate-y-0 opacity-100"
    leave-active-class="transition-all duration-200 ease-in"
    leave-from-class="translate-y-0 opacity-100"
    leave-to-class="translate-y-3 opacity-0"
  >
    <button
      v-if="showBackToTop"
      type="button"
      aria-label="Back to top"
      class="fixed bottom-5 right-4 z-40 flex h-11 w-11 cursor-pointer items-center justify-center rounded-full bg-[#FFA500] text-black shadow-lg shadow-black/40 transition-all duration-200 hover:scale-105 hover:bg-[#FFB52E] hover:shadow-xl hover:shadow-black/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFA500]/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0B0D10] active:scale-95 sm:bottom-6 sm:right-6 sm:h-12 sm:w-12"
      @click="backToTop"
    >
      <ArrowUp :size="20" :stroke-width="2.5" />
    </button>
  </Transition>
</template>