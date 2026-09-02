<script setup>
import { reactive, ref } from "vue";
import { useRouter } from "vue-router";
import { User, Mail, Eye, EyeOff, Loader2 } from "lucide-vue-next";
import BrandLogo from "../auth/BrandLogo.vue";
import AuthField from "../auth/AuthField.vue";
import SocialLoginButton from "../auth/SocialLoginButton.vue";
import { register } from "../../api/auth.js";

// Register calls POST /api/register with name, email, password, and
// password_confirmation (required because the backend uses a "confirmed"
// validation rule). On success it stores the returned JWT + user and
// redirects to /admin/overview. On failure it shows the backend error.

import heroVideo from "../../assets/video/From Klickpin.com- 9 Refined small bedroom decor ideas that help you create a polished look with very simple and affordable details for beginners.mp4";
import heroPoster from "../../assets/hero.png";

const router = useRouter();

const form = reactive({
  name: "",
  email: "",
  password: "",
  confirm: "",
});
const errors = reactive({ name: "", email: "", password: "", confirm: "" });
const showPassword = ref(false);
const showConfirm = ref(false);
const loading = ref(false);
const serverError = ref("");

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validate() {
  errors.name = "";
  errors.email = "";
  errors.password = "";
  errors.confirm = "";

  if (!form.name.trim()) {
    errors.name = "Name is required.";
  }
  if (!form.email.trim()) {
    errors.email = "Email is required.";
  } else if (!EMAIL_RE.test(form.email.trim())) {
    errors.email = "Please enter a valid email address.";
  }
  if (!form.password) {
    errors.password = "Password is required.";
  } else if (form.password.length < 6) {
    errors.password = "Password must be at least 6 characters.";
  }
  if (!form.confirm) {
    errors.confirm = "Please confirm your password.";
  } else if (form.password !== form.confirm) {
    errors.confirm = "Passwords do not match.";
  }

  return !errors.name && !errors.email && !errors.password && !errors.confirm;
}

// handleSubmit validates the form, then calls the auth module's register(),
// which sends the payload to the backend. While waiting, the button shows a
// spinner; any backend error (e.g. duplicate email) is displayed on screen.
async function handleSubmit() {
  serverError.value = "";
  if (!validate()) return;

  loading.value = true;
  try {
    await register({
      name: form.name.trim(),
      email: form.email.trim(),
      password: form.password,
      password_confirmation: form.confirm,
    });
    router.push("/admin/overview");
  } catch (error) {
    serverError.value =
      error.message || "Unable to create your account. Please try again.";
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
          <span class="whitespace-nowrap">Already have an account?</span>
          <RouterLink
            to="/login"
            class="whitespace-nowrap font-semibold text-[#FFA500] transition hover:text-[#FFB52E]"
          >
            Sign in
          </RouterLink>
          <span class="h-px flex-1 bg-[#3A3A3A]"></span>
        </div>

        <h1 class="mb-7 mt-5 text-[28px] font-bold tracking-tight text-white">
          Create Account
        </h1>

        <form class="space-y-4" novalidate @submit.prevent="handleSubmit">
          <AuthField
            id="reg-name"
            v-model="form.name"
            label="Full Name"
            type="text"
            placeholder="Please enter your full name"
            autocomplete="name"
            :icon="User"
            :error="errors.name"
          />

          <AuthField
            id="reg-email"
            v-model="form.email"
            label="Email"
            type="email"
            placeholder="Please enter your email"
            autocomplete="email"
            :icon="Mail"
            :error="errors.email"
          />

          <AuthField
            id="reg-password"
            v-model="form.password"
            label="Password"
            :type="showPassword ? 'text' : 'password'"
            placeholder="Please enter your password"
            autocomplete="new-password"
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

          <AuthField
            id="reg-confirm"
            v-model="form.confirm"
            label="Confirm Password"
            :type="showConfirm ? 'text' : 'password'"
            placeholder="Confirm your password"
            autocomplete="new-password"
            :error="errors.confirm"
          >
            <template #trailing>
              <button
                type="button"
                class="absolute right-4 top-1/2 -translate-y-1/2 text-[#8A8A8A] transition hover:text-white"
                :aria-label="showConfirm ? 'Hide password' : 'Show password'"
                @click="showConfirm = !showConfirm"
              >
                <EyeOff v-if="showConfirm" class="h-[18px] w-[18px]" />
                <Eye v-else class="h-[18px] w-[18px]" />
              </button>
            </template>
          </AuthField>

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
            <span>{{
              loading ? "Creating account..." : "Create Account"
            }}</span>
          </button>

          <div class="flex items-center gap-3 pt-1 text-sm text-[#8A8A8A]">
            <span class="h-px flex-1 bg-[#3A3A3A]"></span>
            <span class="uppercase text-[11px] tracking-widest">or</span>
            <span class="h-px flex-1 bg-[#3A3A3A]"></span>
          </div>

          <SocialLoginButton
            label="Sign up with Google"
            @click="alert('Google sign-up is not available yet.')"
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
