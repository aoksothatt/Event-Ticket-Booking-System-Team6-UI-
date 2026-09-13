<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import {
  Loader2,
  X,
  Check,
  AlertTriangle,
  Clock,
  Smartphone,
  Ticket,
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
});

const emit = defineEmits([
  "update:modelValue",
  "cancel",
  "retry",
  "check",
  "viewTickets",
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
  if (["pending", "failed", "expired", "cancelled"].includes(s)) return s;
  return "pending";
});

const isTerminal = computed(() =>
  ["paid", "failed", "expired", "cancelled"].includes(paymentStatus.value),
);

const displayAmount = computed(() => {
  const n = Number(props.amount);
  return isNaN(n) ? "0.00" : n.toFixed(2);
});

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
    case "expired":
      return "Payment expired";
    case "failed":
      return "Payment failed";
    default:
      return "Waiting for payment\u2026";
  }
});

const statusClasses = computed(() => {
  switch (paymentStatus.value) {
    case "paid":
      return "bg-emerald-500/10 text-emerald-300 border-emerald-500/30";
    case "expired":
    case "failed":
      return "bg-red-500/10 text-red-300 border-red-500/30";
    default:
      return "bg-amber-500/10 text-amber-300 border-amber-500/30";
  }
});

function close() {
  emit("update:modelValue", false);
  emit("cancel");
}

function retry() {
  emit("retry");
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
                Payment Successful
              </h2>

              <!-- Confirmation copy -->
              <p class="mt-2 text-sm leading-relaxed text-emerald-300/90">
                Your payment has been confirmed.<br />
                Your ticket is now ready.
              </p>

              <!-- Payment Amount -->
              <p class="mt-4 text-3xl font-black text-[#FFA500]">
                ${{ displayAmount }}
                <span class="text-sm font-bold text-white/80">{{
                  currency
                }}</span>
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
                  @click="emit('viewTickets')"
                  class="w-full rounded-xl bg-gradient-to-r from-[#FFA500] to-[#FF8C00] py-3 text-sm font-bold text-slate-950 shadow-md hover:brightness-110 active:scale-98 transition flex items-center justify-center gap-2"
                >
                  <Ticket :size="16" />
                  View My Tickets
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
                <span class="text-2xl font-extrabold text-[#FFA500]">
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
                  v-if="paymentStatus === 'expired' || paymentStatus === 'failed'"
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

                <!-- Clean KHQR Payment Card with Target Corners & Center Logo -->
                <div
                  v-else-if="qrDataUrl"
                  class="relative w-[300px] rounded-2xl bg-white p-5 shadow-2xl border border-gray-100"
                >
                  <!-- Viewfinder Target Corners -->
                  <div
                    class="absolute -top-1 -left-1 w-5 h-5 border-t-[3px] border-l-[3px] border-[#94A3B8] rounded-tl-lg pointer-events-none"
                  ></div>
                  <div
                    class="absolute -top-1 -right-1 w-5 h-5 border-t-[3px] border-r-[3px] border-[#94A3B8] rounded-tr-lg pointer-events-none"
                  ></div>
                  <div
                    class="absolute -bottom-1 -left-1 w-5 h-5 border-b-[3px] border-l-[3px] border-[#94A3B8] rounded-bl-lg pointer-events-none"
                  ></div>
                  <div
                    class="absolute -bottom-1 -right-1 w-5 h-5 border-b-[3px] border-r-[3px] border-[#94A3B8] rounded-br-lg pointer-events-none"
                  ></div>

                  <!-- Card Header -->
                  <div class="flex items-center justify-between">
                    <span
                      class="text-2xl font-black tracking-tight text-[#1B2A5B]"
                    >
                      KH<span class="text-[#E1251B]">QR</span>
                    </span>
                    <span
                      class="text-[10px] font-bold uppercase tracking-wider text-neutral-400"
                    >
                      Scan to pay
                    </span>
                  </div>

                  <p
                    class="mt-2 text-base font-extrabold leading-tight text-neutral-900 truncate"
                  >
                    {{ khqrInfo.merchant || "SOTHAT OUK" }}
                  </p>
                  <hr class="my-3 border-t border-neutral-200" />
                  <!-- QR Matrix with Center Red Emblem -->
                  <div
                    class="relative mt-3 flex items-center justify-center bg-white"
                  >
                    <img
                      :src="qrDataUrl"
                      alt="KHQR payment code"
                      class="h-[200px] w-[200px] rounded-md object-contain"
                      width="200"
                      height="200"
                    />

                    <!-- Red Bakong Emblem Overlay -->
                    <div
                      class="absolute inset-0 m-auto w-11 h-11 rounded-full bg-[#E1251B] border-[3px] border-white shadow-md flex items-center justify-center pointer-events-none"
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

                  <!-- Amount / City Footer -->
                  <div
                    class="mt-3 flex items-end justify-between border-t border-neutral-200 pt-3"
                  >
                    <div class="text-left">
                      <p
                        class="text-[10px] font-semibold uppercase tracking-wide text-neutral-400"
                      >
                        Amount
                      </p>
                      <p class="text-lg font-black text-neutral-900">
                        ${{ displayAmount }}
                        <span class="text-xs font-bold text-neutral-500">
                          {{ currency }}
                        </span>
                      </p>
                    </div>
                    <div class="text-right">
                      <p
                        class="text-[10px] font-semibold uppercase tracking-wide text-neutral-400"
                      >
                        City
                      </p>
                      <p class="text-xs font-bold text-neutral-700">
                        {{ khqrInfo.city || "Phnom Penh" }}
                      </p>
                    </div>
                  </div>
                </div>

                <div
                  v-else
                  class="flex h-[240px] w-[240px] items-center justify-center rounded-xl border border-white/10 bg-[#1D2229]"
                >
                  <Loader2 :size="28" class="animate-spin text-[#FFA500]" />
                </div>
              </div>

              <p
                v-if="notice"
                class="mt-3 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs leading-relaxed text-amber-200"
              >
                {{ notice }}
              </p>

              <!-- <a
                v-if="deeplink && paymentStatus === 'pending'"
                :href="deeplink"
                target="_blank"
                rel="noopener noreferrer"
                class="mt-3 inline-flex items-center gap-2 rounded-full bg-white/5 border border-white/15 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10 hover:border-[#FFA500]/40"
              >
                <Smartphone :size="16" class="text-[#FFA500]" />
                Pay with the Bakong app
              </a> -->

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
                  v-if="paymentStatus === 'pending'"
                  :size="12"
                  class="animate-spin"
                />
                <Check v-else-if="paymentStatus === 'paid'" :size="12" />
                <AlertTriangle v-else :size="12" />
                {{ statusLabel }}
              </span>

              <div class="mt-5 flex justify-center gap-3">
                <button
                  v-if="paymentStatus === 'expired' || paymentStatus === 'failed'"
                  type="button"
                  class="rounded-full bg-[#FFA500] px-5 py-2.5 text-sm font-bold text-black transition hover:bg-[#FFB52E]"
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
