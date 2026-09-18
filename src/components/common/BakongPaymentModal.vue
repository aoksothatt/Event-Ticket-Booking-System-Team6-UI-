<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import {
  Loader2,
  X,
  Check,
  AlertTriangle,
  Clock,
  CalendarDays,
  Ticket,
  Smartphone,
} from "lucide-vue-next";
import QRCode from "qrcode";
import { formatCountdown } from "../../api/bakongApi.js";

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  qrPayload: { type: String, default: "" },
  qrImageUrl: { type: String, default: "" },
  deeplink: { type: String, default: "" },
  amount: { type: [Number, String], default: 0 },
  currency: { type: String, default: "USD" },
  expiresAt: { type: String, default: "" },
  ticketName: { type: String, default: "" },
  quantity: { type: Number, default: 1 },
  summary: { type: String, default: "" },
  status: { type: String, default: "pending" },
  notice: { type: String, default: "" },
  bookingNumber: { type: String, default: "" },
  eventId: { type: [Number, String], default: "" },
  eventName: { type: String, default: "" },
  error: { type: String, default: "" },
});

const emit = defineEmits([
  "update:modelValue",
  "cancel",
  "retry",
  "check",
  "viewTickets",
  "viewEvent",
]);

const qrDataUrl = ref("");
const countdown = ref("--:--");
let countdownTimer = null;

const isOpen = computed(() => props.modelValue);

/**
 * Normalized payment state — the single source of truth the template renders
 * from. The backend only ever writes these (lowercase), but Bakong/gateway
 * responses have been seen as "successful"/"completed". Normalizing keeps the
 * UI consistent without ever assuming any payment is paid on the client.
 */
const paymentStatus = computed(() => {
  const s = String(props.status || "pending").toLowerCase();
  if (["paid", "successful", "completed"].includes(s)) return "paid";
  if (["pending", "held", "failed", "expired", "cancelled"].includes(s))
    return s;
  return "pending";
});

const isTerminal = computed(() =>
  ["paid", "held", "failed", "expired", "cancelled"].includes(
    paymentStatus.value,
  ),
);

const displayAmount = computed(() => {
  const n = Number(props.amount);
  return isNaN(n) ? "0.00" : n.toFixed(2);
});

const currencySymbol = computed(() =>
  String(props.currency || "USD").toUpperCase() === "KHR" ? "៛" : "$",
);

function parseKhqrTlv(payload) {
  const segs = {};
  let rest = payload || "";
  while (rest && rest.length >= 4) {
    const tag = rest.slice(0, 2);
    const len = parseInt(rest.slice(2, 4), 10);
    const value = rest.slice(4, 4 + len);
    if (value.length !== len) break;
    segs[tag] = value;
    rest = rest.slice(4 + len);
  }
  return segs;
}

const khqrInfo = computed(() => {
  try {
    const segs = parseKhqrTlv(props.qrPayload);
    let account = "";
    if (segs["29"]) {
      account = parseKhqrTlv(segs["29"])["00"] || "";
    }
    return {
      merchant: segs["59"] || "",
      city: segs["60"] || "",
      account,
    };
  } catch {
    return { merchant: "", city: "", account: "" };
  }
});

const statusLabel = computed(() => {
  switch (paymentStatus.value) {
    case "paid":
      return "Payment confirmed";
    case "held":
      return "Payment received — awaiting confirmation";
    case "expired":
      return "Payment expired";
    case "failed":
      return "Payment failed";
    default:
      return isError.value
        ? "Couldn't confirm payment"
        : "Waiting for payment\u2026";
  }
});

const statusClasses = computed(() => {
  switch (paymentStatus.value) {
    case "paid":
      return "bg-emerald-500/10 text-emerald-300 border-emerald-500/30";
    case "held":
      return "bg-amber-500/10 text-amber-300 border-amber-500/30";
    case "expired":
    case "failed":
      return "bg-red-500/10 text-red-300 border-red-500/30";
    default:
      return isError.value
        ? "bg-red-500/10 text-red-300 border-red-500/30"
        : "bg-amber-500/10 text-amber-300 border-amber-500/30";
  }
});

/**
 * Error state — shown when the gateway is unreachable or verification cannot
 * be completed. The QR stays visible (the customer may have already paid and
 * we must never make them pay twice) but we clearly explain the situation and
 * offer a manual re-check instead of silently "waiting".
 */
const isError = computed(
  () => paymentStatus.value === "pending" && !!props.error,
);

function close() {
  emit("update:modelValue", false);
  emit("cancel");
}

function retry() {
  emit("retry");
}

function viewEvent() {
  emit("viewEvent");
}

function startCountdown() {
  stopCountdown();
  if (!props.expiresAt) return;
  countdown.value = formatCountdown(props.expiresAt);

  countdownTimer = setInterval(() => {
    countdown.value = formatCountdown(props.expiresAt);
    if (countdown.value === "00:00" && paymentStatus.value === "pending") {
      stopCountdown();
    }
  }, 1000);
}

function stopCountdown() {
  if (countdownTimer) {
    clearInterval(countdownTimer);
    countdownTimer = null;
  }
}

/**
 * Terminal state (paid/failed/expired/cancelled): the QR is no longer valid.
 * Drop the rendered QR + countdown immediately so nothing payment-related
 * keeps running or rendering in the background.
 */
function dropQr() {
  qrDataUrl.value = "";
}

async function renderQr() {
  if (!isOpen.value) return;
  qrDataUrl.value = "";

  if (props.qrImageUrl) {
    qrDataUrl.value = props.qrImageUrl;
    return;
  }

  if (!props.qrPayload) return;

  if (props.qrPayload.startsWith("data:")) {
    qrDataUrl.value = props.qrPayload;
    return;
  }

  if (props.qrPayload.startsWith("http")) {
    qrDataUrl.value = props.qrPayload;
    return;
  }

  try {
    qrDataUrl.value = await QRCode.toDataURL(props.qrPayload, {
      errorCorrectionLevel: "H",
      width: 240,
      margin: 1,
    });
  } catch {
    qrDataUrl.value = "";
  }
}

watch(isOpen, (open) => {
  if (open) {
    renderQr();
    startCountdown();
  } else {
    stopCountdown();
  }
});

watch(
  () => props.qrPayload,
  () => {
    if (isOpen.value) renderQr();
  },
);

watch(
  () => paymentStatus.value,
  (s) => {
    if (isTerminal.value) {
      stopCountdown();
      dropQr();
    }
  },
);

onMounted(() => {
  if (isOpen.value) {
    renderQr();
    startCountdown();
  }
});

onBeforeUnmount(stopCountdown);
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="duration-200 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="duration-150 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="isOpen"
        class="fixed inset-0 z-50 flex items-center justify-center p-4"
      >
        <div
          class="absolute inset-0 bg-black/60 backdrop-blur-sm"
          @click="close"
        />

        <Transition
          enter-active-class="duration-200 ease-out"
          enter-from-class="scale-95 opacity-0"
          enter-to-class="scale-100 opacity-100"
          leave-active-class="duration-150 ease-in"
          leave-from-class="scale-100 opacity-100"
          leave-to-class="scale-95 opacity-0"
        >
          <div
            v-if="isOpen"
            class="relative w-full max-w-md rounded-2xl border border-white/10 bg-[#14171C] shadow-2xl"
          >
            <button
              type="button"
              class="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full text-[#9CA3AF] transition hover:bg-white/10 hover:text-white"
              @click="close"
            >
              <X :size="18" />
            </button>

            <!-- ================= STATE 1: PAYMENT SUCCESSFUL (PAID) ================= -->
            <div v-if="paymentStatus === 'paid'" class="p-6 text-center">
              <!-- Success Green Icon -->
              <div
                class="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/15 border-2 border-emerald-500/30 text-emerald-400 shadow-lg"
              >
                <Check :size="44" stroke-width="3" />
              </div>

              <!-- Main Title -->
              <h2 class="text-2xl font-black tracking-tight text-white">
                Payment Successful!
              </h2>

              <!-- Confirmation copy -->
              <p class="mt-2 text-sm leading-relaxed text-emerald-300/90">
                Your payment has been confirmed.<br />
                Your ticket is ready.
              </p>

              <!-- Payment Amount -->
              <p class="mt-4 text-3xl font-black text-primary">
                ${{ displayAmount }}
                <span class="text-sm font-bold text-white/80">{{
                  currency
                }}</span>
              </p>

              <!-- Event name -->
              <p
                v-if="eventName"
                class="mt-2 text-sm font-semibold text-neutral-200"
              >
                {{ eventName }}
              </p>

              <!-- Booking Confirmed Badge -->
              <div
                class="mt-3 inline-flex items-center gap-1.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 px-3.5 py-1 text-xs font-bold text-emerald-300"
              >
                <Check :size="14" stroke-width="2.5" />
                Booking confirmed
              </div>

              <!-- Booking Reference -->
              <p
                v-if="bookingNumber"
                class="mt-3 font-mono text-sm font-semibold text-neutral-300"
              >
                Booking #{{ bookingNumber }}
              </p>

              <!-- Action Buttons -->
              <div class="mt-6 flex flex-col gap-2.5">
                <button
                  type="button"
                  @click="viewEvent"
                  class="w-full rounded-xl bg-gradient-to-r from-primary to-primary-hover py-3 text-sm font-bold text-primary-contrast shadow-md hover:brightness-110 active:scale-98 transition flex items-center justify-center gap-2"
                >
                  <CalendarDays :size="16" />
                  View Event
                </button>
                <button
                  type="button"
                  @click="emit('viewTickets')"
                  class="w-full rounded-xl border border-white/15 bg-white/10 py-3 text-sm font-bold text-white shadow-md transition hover:bg-white/20 active:scale-98 flex items-center justify-center gap-2"
                >
                  <Ticket :size="16" />
                  See My Ticket
                </button>
                <button
                  type="button"
                  @click="close"
                  class="w-full rounded-xl border border-white/15 bg-white/5 py-2.5 text-xs font-semibold text-neutral-400 hover:text-white hover:bg-white/10 transition"
                >
                  Done
                </button>
              </div>
            </div>

            <!-- ================= STATE 2: PENDING / QR / FAILED ================= -->
            <div v-else class="p-6 text-center">
              <h2 class="text-lg font-extrabold text-white">Bakong Payment</h2>

              <p v-if="summary" class="mt-1 text-sm text-[#9CA3AF]">
                {{ summary }}
              </p>

              <p v-else-if="ticketName" class="mt-1 text-sm text-[#9CA3AF]">
                {{ ticketName }} &times; {{ quantity }}
              </p>

              <div class="mt-4 flex items-center justify-center gap-2">
                <span class="text-2xl font-extrabold text-primary">
                  ${{ displayAmount }}
                </span>
                <span
                  class="rounded-full bg-white/10 px-2.5 py-0.5 text-xs font-semibold text-white"
                >
                  {{ currency }}
                </span>
              </div>

              <div class="my-5 flex justify-center">
                <div
                  v-if="
                    paymentStatus === 'expired' || paymentStatus === 'failed'
                  "
                  class="flex h-[260px] w-[260px] flex-col items-center justify-center gap-3 rounded-2xl border border-red-500/30 bg-red-500/10 p-4"
                >
                  <AlertTriangle :size="48" class="text-red-400" />
                  <p class="text-sm font-bold text-red-300">
                    {{
                      paymentStatus === "expired"
                        ? "Payment Expired"
                        : "Payment Failed"
                    }}
                  </p>
                  <p class="text-xs text-red-400/80">
                    {{
                      paymentStatus === "expired"
                        ? "This payment QR code has expired. Please start checkout again."
                        : "We couldn't confirm your payment. Please try again."
                    }}
                  </p>
                </div>

                <!-- Held for manual review: the bank's gateway cannot
                     auto-verify this QR type. The money may already have been
                     received — the QR is hidden so nobody is told to pay again. -->
                <div
                  v-else-if="paymentStatus === 'held'"
                  class="flex min-h-[260px] w-[300px] flex-col items-center justify-center gap-2.5 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-6 text-center"
                >
                  <Clock :size="44" class="text-amber-300" />
                  <p class="text-sm font-bold text-amber-200">
                    Payment received — awaiting confirmation
                  </p>
                  <p class="text-xs leading-relaxed text-amber-200/80">
                    The bank's gateway can't auto-verify this QR type. Your
                    booking is held while we confirm your payment manually — do
                    NOT pay again. We'll update your tickets as soon as it's
                    confirmed.
                  </p>
                  <p
                    v-if="error"
                    class="mt-1 rounded-lg border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-[11px] leading-relaxed text-amber-200/90"
                  >
                    {{ error }}
                  </p>
                  <button
                    type="button"
                    @click="emit('check')"
                    class="mt-2 rounded-full bg-white/10 px-4 py-1.5 text-xs font-bold text-amber-200 transition hover:bg-white/20"
                  >
                    Check again
                  </button>
                </div>

                <!-- Bakong-style KHQR Payment Card (matches img/qrcode.png) -->
                <div
                  v-else-if="qrDataUrl"
                  class="w-[300px] overflow-hidden rounded-2xl bg-white shadow-2xl"
                >
                  <!-- Red Header Banner -->
                  <div class="bg-[#E1251B] px-5 pb-3.5 pt-4 text-center">
                    <p
                      class="text-[10px] font-bold uppercase tracking-[0.22em] text-white/80"
                    >
                      Scan to pay
                    </p>
                    <p
                      class="mt-1 truncate text-2xl font-black leading-tight tracking-tight text-white"
                    >
                      {{ khqrInfo.merchant || "SOTHAT OUK" }}
                    </p>
                  </div>

                  <!-- White Card Body -->
                  <div class="px-6 pb-5 pt-4">
                    <!-- Amount -->
                    <div class="flex items-baseline justify-center gap-1.5">
                      <span
                        class="text-2xl font-black tracking-tight text-neutral-900"
                      >
                        {{ currencySymbol }}{{ displayAmount }}
                      </span>
                      <span class="text-sm font-bold text-neutral-500">
                        {{ currency }}
                      </span>
                    </div>

                    <!-- QR Matrix with Center Red Emblem -->
                    <div class="relative mt-4 flex items-center justify-center">
                      <img
                        :src="qrDataUrl"
                        alt="KHQR payment code"
                        class="h-[210px] w-[210px] rounded-lg object-contain"
                        width="210"
                        height="210"
                      />

                      <!-- Red Bakong Emblem Overlay -->
                      <div
                        class="absolute inset-0 m-auto w-10 h-10 rounded-full bg-[#E1251B] border-[3px] border-white shadow-md flex items-center justify-center pointer-events-none"
                      >
                        <svg
                          class="w-5 h-5 text-white"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                        >
                          <!-- Main Angkor Wat Towers Silhouette -->
                          <path
                            d="M1 19h22v1H1v-1zm1-1h20v-2h-1v-2h-1v-2h-1v-1h-1v2h-1v-2h-1v-3h-1v-1h-1v-2h-1v-1h-2v1h-1v2h-1v1h-1v3h-1v2h-1v-2h-1v1h-1v2h-1v2h-1v2H2v2z"
                          />
                          <!-- Optional inner detail dots or accents -->
                          <circle cx="12" cy="7" r="1" fill="#FFFFFF" />
                          <circle cx="12" cy="7" r="0.5" fill="#E1251B" />
                        </svg>
                      </div>
                    </div>

                    <!-- City / Booking Footer -->
                    <div
                      class="mt-4 flex items-center justify-between border-t border-neutral-100 pt-3"
                    >
                      <!-- <div class="text-left">
                        <p
                          class="text-[10px] font-semibold uppercase tracking-wide text-neutral-400"
                        >
                          City
                        </p>
                        <p class="text-xs font-bold text-neutral-700">
                          {{ khqrInfo.city || "Phnom Penh" }}
                        </p>
                      </div> -->
                      <!-- <div v-if="bookingNumber" class="text-right">
                        <p
                          class="text-[10px] font-semibold uppercase tracking-wide text-neutral-400"
                        >
                          Booking
                        </p>
                        <p class="text-xs font-bold text-neutral-700">
                          {{ bookingNumber }}
                        </p>
                      </div> -->
                    </div>

                    <!-- <p
                      class="mt-3 rounded-full bg-[#F5F5F5] px-3 py-2 text-center text-[11px] font-semibold text-neutral-500"
                    >
                      Use the Bakong / KHQR app to scan this code
                    </p> -->
                  </div>
                </div>

                <div
                  v-else
                  class="flex h-[240px] w-[240px] items-center justify-center rounded-xl border border-white/10 bg-[#1D2229]"
                >
                  <Loader2 :size="28" class="animate-spin text-primary" />
                </div>
              </div>

              <div
                v-if="isError"
                class="mt-3 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-3 text-left"
              >
                <div class="flex items-start gap-2">
                  <AlertTriangle
                    :size="15"
                    class="mt-0.5 shrink-0 text-red-400"
                  />
                  <div class="min-w-0">
                    <p class="text-xs font-bold text-red-300">
                      We couldn't confirm your payment
                    </p>
                    <p class="mt-0.5 text-xs leading-relaxed text-red-300/80">
                      {{ error }}
                    </p>
                    <p class="mt-1 text-xs leading-relaxed text-red-300/80">
                      If you already paid, do NOT pay again — we'll check once
                      the gateway recovers.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  @click="emit('check')"
                  class="mt-2.5 rounded-full bg-red-500/20 px-4 py-1.5 text-xs font-bold text-red-200 transition hover:bg-red-500/30"
                >
                  Check again
                </button>
              </div>

              <p
                v-if="notice"
                class="mt-3 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs leading-relaxed text-amber-200"
              >
                {{ notice }}
              </p>

              <a
                v-if="deeplink && paymentStatus === 'pending'"
                :href="deeplink"
                target="_blank"
                rel="noopener noreferrer"
                class="mt-3 inline-flex items-center gap-2 rounded-full bg-white/5 border border-white/15 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10 hover:border-primary/40"
              >
                <Smartphone :size="16" class="text-primary" />
                Pay with the Bakong app
              </a>

              <div
                v-if="paymentStatus === 'pending' && expiresAt"
                class="mt-3 flex items-center justify-center gap-1.5 text-sm text-[#9CA3AF]"
              >
                <Clock :size="14" />
                <span>
                  Expires in
                  <span class="font-mono font-bold text-white">{{
                    countdown
                  }}</span>
                </span>
              </div>

              <span
                class="mt-4 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold"
                :class="statusClasses"
              >
                <Loader2
                  v-if="paymentStatus === 'pending' && !isError"
                  :size="12"
                  class="animate-spin"
                />
                <AlertTriangle v-else :size="12" />
                {{ statusLabel }}
              </span>

              <div class="mt-5 flex justify-center gap-3">
                <button
                  v-if="paymentStatus === 'pending' && notice"
                  type="button"
                  class="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-bold text-primary-contrast transition hover:bg-primary-hover"
                  @click="emit('check')"
                >
                  <Check :size="14" stroke-width="3" />
                  Check again
                </button>
                <button
                  v-if="
                    paymentStatus === 'expired' || paymentStatus === 'failed'
                  "
                  type="button"
                  class="rounded-full bg-primary px-5 py-2.5 text-sm font-bold text-primary-contrast transition hover:bg-primary-hover"
                  @click="retry"
                >
                  Try Again
                </button>
              </div>
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>
