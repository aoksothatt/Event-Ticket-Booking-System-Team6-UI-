<script setup>
import { onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { Loader2, AlertCircle, LogIn } from "lucide-vue-next";
import BrandLogo from "../../components/auth/BrandLogo.vue";
import { useAuthStore } from "../../stores/auth.js";
import { computeDestination } from "../../composables/useAuthRedirect.js";
import { toast } from "../../composables/useToast.js";

/**
 * Google OAuth callback page.
 *
 * The browser lands here (a *frontend* route) after Google authenticated the
 * user and Laravel redirects it here, e.g.:
 *
 *   http://localhost:5173/auth/google/callback?token=eyJ0eXAiOi...
 *
 * Responsibilties:
 *  1. Read the JWT from the `token` query parameter (or fail on `error`).
 *  2. Persist it (localStorage) via the Pinia auth store.
 *  3. Fetch the authenticated user's profile from the backend.
 *  4. Redirect back to the page the user was headed for (saved by
 *     <GoogleLoginButton> in sessionStorage), or the home page.
 *
 * The browser never stays on the Laravel callback URL — the backend performs
 * a 302 redirect to this SPA route, so this page always runs in Vue Router.
 */

const route = useRoute();
const router = useRouter();
const auth = useAuthStore();

const status = ref("loading"); // "loading" | "success" | "error"
const errorMessage = ref("");

/** Resume the session-intent destination, or land on the role-based home. */
function redirectAfterLogin() {
  toast("Signed in with Google!", "success");
  const destination = computeDestination({
    fallback: auth.isAdmin ? "/admin/overview" : "/home",
  });
  router.replace(destination);
}

async function processToken(token) {
  try {
    await auth.loginWithGoogle(token);
    status.value = "success";
    redirectAfterLogin();
  } catch (error) {
    // The session is already invalid — make sure nothing half-baked remains.
    auth.clearSession();
    status.value = "error";
    errorMessage.value =
      error?.response?.data?.message ||
      error?.message ||
      "Google sign-in failed. Please try again.";
  }
}

onMounted(() => {
  const token = typeof route.query.token === "string" ? route.query.token : "";
  const error = typeof route.query.error === "string" ? route.query.error : "";

  if (error) {
    status.value = "error";
    errorMessage.value =
      "Google sign-in was cancelled or failed. Please try again.";
    return;
  }

  if (!token) {
    status.value = "error";
    errorMessage.value =
      "No authentication token was received from the server. Please sign in again.";
    return;
  }

  processToken(token);
});
</script>

<template>
  <div class="flex min-h-screen items-center justify-center bg-[#202020] px-5 py-12 text-white">
    <section class="flex w-full max-w-md flex-col items-center justify-center">
      <BrandLogo class="mb-10" />

      <!-- Loading -->
      <div v-if="status === 'loading'" class="flex flex-col items-center gap-4 text-center">
        <Loader2 class="h-10 w-10 animate-spin text-[#FFA500]" />
        <p class="text-sm text-[#BDBDBD]">Completing your Google sign-in…</p>
      </div>

      <!-- Success -->
      <div v-else-if="status === 'success'" class="flex flex-col items-center gap-4 text-center">
        <p class="text-2xl font-bold text-white">Welcome aboard!</p>
        <p class="text-sm text-[#BDBDBD]">You are being signed in…</p>
      </div>

      <!-- Error -->
      <div
        v-else
        class="flex w-full flex-col items-center gap-4 rounded-2xl border border-red-500/40 bg-red-500/10 p-6 text-center"
      >
        <AlertCircle class="h-10 w-10 text-red-400" />
        <p class="text-sm font-semibold text-red-300">Sign-in failed</p>
        <p class="text-xs text-red-300/80">{{ errorMessage }}</p>

        <RouterLink
          to="/login"
          class="mt-2 flex h-11 w-full items-center justify-center gap-2 rounded-[6px] bg-[#FFA500] text-sm font-bold text-black transition hover:bg-[#FFB52E] active:scale-[0.99]"
        >
          <LogIn class="h-4 w-4" />
          Back to login
        </RouterLink>
      </div>
    </section>
  </div>
</template>