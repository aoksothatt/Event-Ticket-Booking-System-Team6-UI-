<script setup>
import { reactive, ref } from "vue";
import { useRouter } from "vue-router";
import { Mail, Eye, EyeOff, Loader2 } from "lucide-vue-next";
import BrandLogo from "../auth/BrandLogo.vue";
import AuthField from "../auth/AuthField.vue";
import SocialLoginButton from "../auth/SocialLoginButton.vue";
import { login } from "../../api/auth.js";

// Login calls POST /api/login with email and password.
// On success it stores the JWT token and user in localStorage,
// then redirects to /admin/overview. On failure it shows the
// backend error message (e.g. "Invalid email or password").

import heroVideo from "../../assets/video/From Klickpin.com- 9 Refined small bedroom decor ideas that help you create a polished look with very simple and affordable details for beginners.mp4";
import heroPoster from "../../assets/hero.png";

const router = useRouter();

const form = reactive({ email: "", password: "" });
const errors = reactive({ email: "", password: "" });
const remember = ref(true);
const showPassword = ref(false);
const loading = ref(false);
const serverError = ref("");

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validate() {
  errors.email = "";
  errors.password = "";
  if (!form.email.trim()) {
    errors.email = "Email is required.";
  } else if (!EMAIL_RE.test(form.email.trim())) {
    errors.email = "Please enter a valid email address.";
  }
  if (!form.password) {
    errors.password = "Password is required.";
  }
  return !errors.email && !errors.password;
}

// handleSubmit validates the form, then calls the auth module's login(),
// which sends the credentials to the backend. While waiting, the button
// shows a spinner; any error from the backend is displayed on screen.
async function handleSubmit() {
  serverError.value = "";
  if (!validate()) return;

  loading.value = true;
  try {
    await login(form.email.trim(), form.password);
    router.push("/admin/overview");
  } catch (error) {
    serverError.value = error.message || "Unable to sign in. Please try again.";
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <div
    class="flex min-h-screen items-center justify-center bg-[#202020] px-5 py-12 text-white"
  >
    <div
      class="grid w-full max-w-6xl items-stretch gap-8 md:min-h-[540px] md:grid-cols-[1fr_1.35fr]"
    >
      <!-- LEFT: FORM -->
      <section
        class="order-1 mx-auto flex w-full max-w-md flex-col justify-center"
      >
        <BrandLogo class="mb-10" />

        <div class="flex items-center gap-3 text-[13px] text-[#BDBDBD]">
          <span class="h-px flex-1 bg-[#3A3A3A]"></span>
          <RouterLink
            to="/register"
            class="whitespace-nowrap font-semibold text-[#FFA500] transition hover:text-[#FFB52E]"
          >
            Create Account
          </RouterLink>
          <span class="h-px flex-1 bg-[#3A3A3A]"></span>
        </div>

        <h1 class="mb-7 mt-5 text-[28px] font-bold tracking-tight text-white">
          Sign in
        </h1>

        <form class="space-y-4" novalidate @submit.prevent="handleSubmit">
          <AuthField
            id="login-email"
            v-model="form.email"
            label="Email"
            type="email"
            placeholder="Please enter your email"
            autocomplete="email"
            :icon="Mail"
            :error="errors.email"
          />

          <AuthField
            id="login-password"
            v-model="form.password"
            label="Password"
            :type="showPassword ? 'text' : 'password'"
            placeholder="Please enter your password"
            autocomplete="current-password"
            :error="errors.password"
          >
            <template #trailing>
              <button
                type="button"
                class="absolute right-4 top-1/2 -translate-y-1/2 text-[#8A8A8A] transition hover:text-white"
                :aria-label="showPassword ? 'Hide password' : 'Show password'"
                @click="showPassword = !showPassword"
              >
                <EyeOff v-if="showPassword" class="h-[18px] w-[18px]" />
                <Eye v-else class="h-[18px] w-[18px]" />
              </button>
            </template>
          </AuthField>

          <div class="flex items-center justify-between pt-1 text-[13px]">
            <label
              class="flex cursor-pointer select-none items-center gap-2 text-[#BDBDBD]"
            >
              <input
                v-model="remember"
                type="checkbox"
                class="h-4 w-4 cursor-pointer rounded accent-[#FFA500]"
              />
              Remember Me
            </label>
            <RouterLink
              to="/forgot-password"
              class="text-[#E0E0E0] transition hover:text-white"
            >
              Forgot Password?
            </RouterLink>
          </div>

          <p
            v-if="serverError"
            class="rounded-[6px] border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs text-red-400"
          >
            {{ serverError }}
          </p>

          <button
            type="submit"
            :disabled="loading"
            class="mt-1 flex h-11 w-full items-center justify-center gap-2 rounded-[6px] bg-[#FFA500] text-sm font-bold text-black transition hover:bg-[#FFB52E] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Loader2 v-if="loading" class="h-5 w-5 animate-spin" />
            <span>{{ loading ? "Signing in..." : "Login" }}</span>
          </button>

          <div class="flex items-center gap-3 pt-1 text-sm text-[#8A8A8A]">
            <span class="h-px flex-1 bg-[#3A3A3A]"></span>
            <span class="uppercase text-[11px] tracking-widest">or</span>
            <span class="h-px flex-1 bg-[#3A3A3A]"></span>
          </div>

          <SocialLoginButton
            @click="alert('Google sign-in is not available yet.')"
          />
        </form>
      </section>

      <!-- RIGHT: PROMOTIONAL VIDEO -->
      <section
        class="order-2 relative mt-2 h-56 w-full overflow-hidden rounded-[20px] md:order-none md:mt-0 md:h-full"
      >
        <video
          :src="heroVideo"
          :poster="heroPoster"
          class="h-full w-full object-cover grayscale"
          autoplay
          muted
          loop
          playsinline
          preload="metadata"
        ></video>
        <div
          class="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-black/0"
        ></div>
        <div class="absolute bottom-5 left-5">
          <p
            class="mb-1 text-[11px] font-semibold uppercase tracking-[0.25em] text-[#FFA500]"
          >
            BILIT Presents
          </p>
          <p class="text-lg font-bold drop-shadow-lg">
            Live Shows · Cinema · Events
          </p>
        </div>
      </section>
    </div>
  </div>
</template>
