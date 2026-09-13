<script setup>
import { ref } from "vue";
import { Loader2 } from "lucide-vue-next";
import { GOOGLE_REDIRECT_URL } from "../../config/index.js";
import { saveIntendedRoute } from "../../composables/useAuthRedirect.js";
import { useI18n } from "vue-i18n";

const { t } = useI18n();

const props = defineProps({
  /**
   * Button label. Override per screen, e.g. "Sign up with Google".
   */
  label: { type: String, default: "" },
  /**
   * Optional label shown while the browser is being redirected.
   */
  loadingLabel: { type: String, default: "" },
  /**
   * Optional override for the destination URL (defaults to the backend's
   * `/auth/google` web route).
   */
  redirectTo: { type: String, default: "" },
  /**
   * Force the disabled/loading state from a parent (e.g. while the form
   * loader is active). Defaults to the component's own redirecting state.
   */
  loading: { type: Boolean, default: false },
});

const emit = defineEmits(["error"]);

const redirecting = ref(false);

/**
 * Kick off the OAuth flow by navigating the *whole browser* to Laravel's
 * `/auth/google` endpoint. This must be a full page navigation: Google (and
 * eventually Laravel) have to see the real browser so they can redirect back.
 */
function handleClick() {
  // Remember where the user was before the full-page OAuth round-trip so the
  // callback page can send them straight back after signing in.
  saveIntendedRoute();
  redirecting.value = true;
  try {
    window.location.href = props.redirectTo || GOOGLE_REDIRECT_URL;
  } catch (error) {
    redirecting.value = false;
    emit("error", error);
  }
}
</script>

<template>
  <button
    type="button"
    :disabled="redirecting || loading"
    class="relative flex h-11 w-full items-center rounded-[6px] border border-slate-200 dark:border-[#454545] bg-white dark:bg-[#303030] text-sm font-medium text-slate-900 dark:text-[#E0E0E0] transition hover:border-slate-300 dark:hover:border-[#5A5A5A] hover:bg-slate-100 dark:hover:bg-[#383838] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-70"
    @click="handleClick"
  >
    <!-- Left icon: Google "G" while idle, spinner while redirecting -->
    <span class="absolute left-4 top-1/2 -translate-y-1/2">
      <Loader2 v-if="redirecting || loading" class="h-5 w-5 animate-spin text-slate-900 dark:text-[#E0E0E0]" />
      <svg
        v-else
        class="h-5 w-5"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z" />
        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z" />
        <path fill="#FBBC05" d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84z" />
        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15A10.97 10.97 0 0 0 12 1 11 11 0 0 0 2.18 7.06l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z" />
      </svg>
    </span>

    <span class="w-full pl-2 text-center">{{ redirecting || loading ? (loadingLabel || t('redirectToGoogle')) : (label || t('continueWithGoogle')) }}</span>
  </button>
</template>