<script setup>
import { reactive, ref, onUnmounted } from "vue";
import { useRouter } from "vue-router";
import {
  Mail,
  KeyRound,
  Check,
  ArrowLeft,
  Loader2,
  Eye,
  EyeOff,
} from "lucide-vue-next";
import BrandLogo from "./BrandLogo.vue";
import AuthField from "./AuthField.vue";
import { sendOtp, verifyOtp, resetPassword } from "../../api/auth.js";

/**
 * Forgot Password — a 3-step wizard that mirrors the backend flow:
 *   1. Enter email  -> POST /api/otp/send   (backend emails a 6-digit OTP)
 *   2. Enter OTP    -> POST /api/otp/verify (backend returns a reset_token)
 *   3. New password -> POST /api/reset      (backend saves the new password)
 */

const router = useRouter();

// step: 1 = email, 2 = otp, 3 = new password, 4 = success confirmation
const step = ref(1);

// Shared state passed between steps
const email = ref("");

// Step 3 password fields
const passwords = reactive({ password: "", confirm: "" });
const showPassword = ref(false);
const showConfirm = ref(false);

// OTP input
const otp = ref("");

const loading = ref(false);
const serverError = ref("");

// Holds the reset_token returned by OTP verification (used in step 3)
let resetToken = "";

// OTP expiry countdown. The backend stores the OTP for 5 minutes (300s).
// We show how much time is left as a countdown while the user is on step 2.
const OTP_EXPIRY_SECONDS = 300;
const otpRemaining = ref(OTP_EXPIRY_SECONDS);
let otpTimer = null;

// Formats a second count as "MM:SS", e.g. 300 -> "05:00"
function formatTime(seconds) {
  const m = String(Math.floor(seconds / 60)).padStart(2, "0");
  const s = String(seconds % 60).padStart(2, "0");
  return `${m}:${s}`;
}

// Starts (or restarts) the countdown when the OTP is sent
function startOtpCountdown() {
  stopOtpCountdown();
  otpRemaining.value = OTP_EXPIRY_SECONDS;
  otpTimer = setInterval(() => {
    if (otpRemaining.value <= 1) {
      stopOtpCountdown();
      otpRemaining.value = 0;
    } else {
      otpRemaining.value -= 1;
    }
  }, 1000);
}

// Clears the countdown interval
function stopOtpCountdown() {
  if (otpTimer) {
    clearInterval(otpTimer);
    otpTimer = null;
  }
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// ─── Step 1: send OTP to the given email ───────────────────────────────────
async function handleSendOtp() {
  serverError.value = "";
  if (!email.value.trim()) {
    serverError.value = "Please enter your email.";
    return;
  }
  if (!EMAIL_RE.test(email.value.trim())) {
    serverError.value = "Please enter a valid email address.";
    return;
  }

  loading.value = true;
  try {
    await sendOtp(email.value.trim());
    step.value = 2;
    startOtpCountdown(); // begin the 5-minute expiry countdown
  } catch (error) {
    serverError.value =
      error.message || "Unable to send the code. Please try again.";
  } finally {
    loading.value = false;
  }
}

// ─── Step 2: verify OTP -> obtain reset_token ──────────────────────────────
async function handleVerifyOtp() {
  serverError.value = "";
  if (!/^\d{6}$/.test(otp.value.trim())) {
    serverError.value = "Please enter the 6-digit code.";
    return;
  }

  loading.value = true;
  try {
    const data = await verifyOtp(email.value.trim(), otp.value.trim());
    resetToken = data?.data?.reset_token;
    step.value = 3;
  } catch (error) {
    serverError.value = error.message || "Invalid code. Please try again.";
  } finally {
    loading.value = false;
  }
}

// ─── Step 3: set new password ──────────────────────────────────────────────
async function handleResetPassword() {
  serverError.value = "";
  if (passwords.password.length < 8) {
    serverError.value = "Password must be at least 8 characters.";
    return;
  }
  if (passwords.password !== passwords.confirm) {
    serverError.value = "Passwords do not match.";
    return;
  }

  loading.value = true;
  try {
    await resetPassword({
      reset_token: resetToken,
      password: passwords.password,
      password_confirmation: passwords.confirm,
    });
    step.value = 4; // success screen
    stopOtpCountdown(); // no longer need the expiry countdown
  } catch (error) {
    serverError.value =
      error.message || "Unable to reset your password. Please try again.";
  } finally {
    loading.value = false;
  }
}

function goToLogin() {
  stopOtpCountdown();
  router.push("/login");
}

function goBack() {
  serverError.value = "";
  stopOtpCountdown(); // restart countdown freshly when re-entering step 2
  step.value -= 1;
}

// Clean up the countdown timer if the user leaves the page mid-flow
onUnmounted(stopOtpCountdown);
</script>

<template>
  <div
    class="flex min-h-screen items-center justify-center bg-[#202020] px-5 py-12 text-white"
  >
    <div class="w-full max-w-md">
      <BrandLogo class="mb-10" />

      <!-- STEP 4: Success -->
      <section v-if="step === 4" class="text-center">
        <div
          class="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-green-500/15"
        >
          <Check class="h-8 w-8 text-green-500" />
        </div>
        <h1 class="mb-2 text-[24px] font-bold tracking-tight">
          Password reset successful
        </h1>
        <p class="mb-8 text-sm text-[#BDBDBD]">
          Your password has been changed. You can now sign in with your new
          password.
        </p>
        <button
          type="button"
          @click="goToLogin"
          class="flex h-11 w-full items-center justify-center rounded-[6px] bg-[#FFA500] text-sm font-bold text-black transition hover:bg-[#FFB52E] active:scale-[0.99]"
        >
          Back to Sign in
        </button>
      </section>

      <!-- STEPS 1-3 -->
      <template v-else>
        <!-- <div v-if="step > 1" class="-mb-1 flex items-start">
          <button
            type="button"
            @click="goBack"
            class="inline-flex -ml-1 items-center gap-1.5 rounded px-1 py-1 text-[13px] text-[#BDBDBD] transition hover:text-white"
          >
            <ArrowLeft class="h-4 w-4" />
            Back
          </button>
        </div> -->

        <h1 class="mb-7 mt-1 text-[28px] font-bold tracking-tight text-white">
          {{
            step === 1
              ? "Forgot Password?"
              : step === 2
                ? "Enter the code"
                : "Set a new password"
          }}
        </h1>

        <p class="-mt-4 mb-6 text-sm text-[#BDBDBD]">
          <template v-if="step === 1">
            Enter your account email and we'll send you a verification code.
          </template>
          <template v-else-if="step === 2">
            We sent a 6-digit code to
            <span class="font-semibold text-white">{{ email }}</span
            >. Please enter it below.
          </template>
          <template v-else>
            Choose a new password (at least 8 characters).
          </template>
        </p>

        <!-- OTP expiry countdown (step 2 only) -->
        <div
          v-if="step === 2"
          class="mb-6 flex items-center justify-between rounded-[6px] border border-[#FFA500]/30 bg-[#FFA500]/10 px-3 py-2 text-xs"
          :class="
            otpRemaining === 0
              ? 'text-red-400 border-red-500/40 bg-red-500/10'
              : 'text-[#FFA500]'
          "
        >
          <span>{{
            otpRemaining === 0
              ? "Code expired. Please request a new one."
              : "This code expires in"
          }}</span>
          <span v-if="otpRemaining > 0" class="font-mono font-bold text-base">
            {{ formatTime(otpRemaining) }}
          </span>
        </div>

        <form
          class="space-y-4"
          novalidate
          @submit.prevent="
            step === 1
              ? handleSendOtp()
              : step === 2
                ? handleVerifyOtp()
                : handleResetPassword()
          "
        >
          <!-- Step 1: email -->
          <AuthField
            v-if="step === 1"
            id="fp-email"
            v-model="email"
            label="Email"
            type="email"
            placeholder="Please enter your email"
            autocomplete="email"
            :icon="Mail"
          />

          <!-- Step 2: OTP -->
          <AuthField
            v-else-if="step === 2"
            id="fp-otp"
            v-model="otp"
            label="Verification Code"
            type="text"
            inputmode="numeric"
            placeholder="6-digit code"
            autocomplete="one-time-code"
            :icon="KeyRound"
          />

          <!-- Step 3: new password -->
          <template v-else>
            <AuthField
              id="fp-password"
              v-model="passwords.password"
              label="New Password"
              :type="showPassword ? 'text' : 'password'"
              placeholder="At least 8 characters"
              autocomplete="new-password"
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
              id="fp-confirm"
              v-model="passwords.confirm"
              label="Confirm New Password"
              :type="showConfirm ? 'text' : 'password'"
              placeholder="Re-enter your password"
              autocomplete="new-password"
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
          </template>

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
              step === 1
                ? loading
                  ? "Sending code..."
                  : "Send Verification Code"
                : step === 2
                  ? loading
                    ? "Verifying..."
                    : "Verify Code"
                  : loading
                    ? "Resetting..."
                    : "Reset Password"
            }}</span>
          </button>
        </form>

        <p class="mt-6 text-center text-sm text-[#BDBDBD]">
          Remembered your password?
          <RouterLink
            to="/login"
            class="font-semibold text-[#FFA500] transition hover:text-[#FFB52E]"
          >
            Sign in
          </RouterLink>
        </p>
      </template>
    </div>
  </div>
</template>
