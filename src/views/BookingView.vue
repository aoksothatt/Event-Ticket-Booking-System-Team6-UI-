<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { Loader2, Ticket, ChevronLeft, Minus, Plus, Check } from "lucide-vue-next";
import { getEvent } from "../api/eventApi.js";
import {
  checkout,
  confirmPayment,
  formatCountdown,
} from "../api/checkoutApi.js";
import { useAuthStore } from "../stores/auth.js";
import { toast } from "../composables/useToast.js";
import {
  coverImage,
  formatDate,
  formatTime,
  formatPrice,
} from "../utils/event.js";
import BakongPaymentModal from "../components/common/BakongPaymentModal.vue";

const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const auth = useAuthStore();

const event = ref(null);
const loading = ref(true);
const error = ref("");
const submitting = ref(false);
const submitError = ref("");
const success = ref(null);

const showModal = ref(false);
const order = ref(null);
const gatewayNotice = ref("");

let countdownTimer = null;
let verifyTimer = null;

const SESSION_KEY = "bakong_booking";

function getSessionKey() {
  const uid = auth.user?.id || "guest";
  return `${SESSION_KEY}_${uid}`;
}

const quantities = ref({});

const ticketTypes = computed(
  () => event.value?.ticketTypes || event.value?.ticket_types || [],
);

/* ----- Pending-booking persistence (prevents duplicate bookings on refresh/retry) ----- */

function storedBooking(eventId) {
  try {
    const key = getSessionKey();
    const map = JSON.parse(sessionStorage.getItem(key) || "{}");
    return map[String(eventId)] || null;
  } catch {
    return null;
  }
}

function persistBooking(eventId, bookingId, signature) {
  try {
    const key = getSessionKey();
    const map = JSON.parse(sessionStorage.getItem(key) || "{}");
    map[String(eventId)] = { booking_id: bookingId, signature };
    sessionStorage.setItem(key, JSON.stringify(map));
  } catch {
    /* storage unavailable — checkout still works */
  }
}

function clearStoredBooking(eventId) {
  try {
    sessionStorage.removeItem(SESSION_KEY);
    const key = getSessionKey();
    const map = JSON.parse(sessionStorage.getItem(key) || "{}");
    delete map[String(eventId)];
    sessionStorage.setItem(key, JSON.stringify(map));
  } catch {
    /* ignore */
  }
}

function selectionSignature(items) {
  return items
    .map((i) => `${i.ticket_type_id}:${i.quantity}`)
    .sort()
    .join(",");
}

function ensureQuantities() {
  const q = {};
  for (const t of ticketTypes.value) {
    q[t.id] = 0;
  }
  quantities.value = q;
}

function selectedItems() {
  return Object.entries(quantities.value)
    .filter(([, qty]) => Number(qty) > 0)
    .map(([id, qty]) => ({
      ticket_type_id: Number(id),
      quantity: Number(qty),
    }));
}

const subtotal = computed(() =>
  ticketTypes.value.reduce((sum, t) => {
    const qty = Number(quantities.value[t.id] || 0);
    const max = Math.max(
      0,
      Number(t.quantity || 0) - Number(t.sold_quantity || 0),
    );
    const effective = Math.min(qty, max);
    return sum + Number(t.price || 0) * effective;
  }, 0),
);

const hasSelection = computed(() => selectedItems().length > 0);

function availableFor(ticket) {
  if (ticket.quantity === undefined || ticket.quantity === null)
    return Infinity;
  return Math.max(
    0,
    Number(ticket.quantity) - Number(ticket.sold_quantity || 0),
  );
}

function increment(t) {
  const max = availableFor(t);
  quantities.value[t.id] = Math.min(
    Number(quantities.value[t.id] || 0) + 1,
    max || 1,
  );
}

function decrement(t) {
  quantities.value[t.id] = Math.max(0, Number(quantities.value[t.id] || 0) - 1);
}

function handleCheckoutError(e) {
  const status = e.response?.status;
  const serverMsg = e.response?.data?.message;

  if (status === 401) return serverMsg || "Please sign in again to continue.";
  if (status === 403)
    return serverMsg || "You are not authorized to make this booking.";
  if (status === 429)
    return (
      serverMsg || "Too many requests. Please wait a moment and try again."
    );
  if (status === 422)
    return serverMsg || "Please check your ticket selection and try again.";
  if (status === 502 || status === 503)
    return (
      serverMsg ||
      "The payment gateway is temporarily unavailable. Please try again."
    );

  if (e.code === "ECONNABORTED" || e.message?.includes("timeout")) {
    return "The request timed out. Please check your connection and try again.";
  }
  if (!e.response)
    return "Network error. Please check your connection and try again.";

  return serverMsg || "Could not initiate payment. Please try again.";
}

async function load(id) {
  loading.value = true;
  error.value = "";
  try {
    event.value = await getEvent(id);
    ensureQuantities();
  } catch (e) {
    error.value = e.message || t('couldNotLoadEvent');
  } finally {
    loading.value = false;
  }
}

/**
 * One checkout creates ONE booking + ONE payment + ONE KHQR for the whole
 * order. If a pending booking for this exact selection already exists, the
 * booking_id is passed so the backend reuses it (no duplicate booking) and
 * simply returns the live QR (or creates a fresh payment if it expired).
 */
async function doCheckout() {
  submitError.value = "";
  if (!hasSelection.value) {
    submitError.value = t('selectTicket');
    return;
  }
  const user = auth.user;
  if (!user?.id) {
    submitError.value = t('signInToBook');
    return;
  }

  submitting.value = true;
  gatewayNotice.value = "";
  try {
    const items = selectedItems();
    const signature = selectionSignature(items);
    const stored = storedBooking(event.value.id);
    const bookingId =
      stored && stored.signature === signature ? stored.booking_id : undefined;

    const res = await checkout({
      event_id: Number(event.value.id),
      items,
      booking_id: bookingId,
    });
    const data = res.data;
    const booking_id = data.booking?.id || null;

    if (booking_id) {
      persistBooking(event.value.id, booking_id, signature);
    }

    const lines = items.map((i) => {
      const t = ticketTypes.value.find(
        (tt) => tt.id === Number(i.ticket_type_id),
      );
      return `${t?.name || `Ticket #${i.ticket_type_id}`} × ${i.quantity}`;
    });

    order.value = {
      paymentId: data.payment?.id,
      booking_id,
      bookingNumber: data.booking?.booking_number || "",
      amount: Number(data.amount ?? data.payment?.amount ?? 0),
      currency: data.currency || "USD",
      qrPayload: data.qr_payload || "",
      deeplink: data.deeplink || data.payment?.deeplink || "",
      expiresAt: data.expires_at || data.payment?.expires_at || "",
      status: data.payment?.status || "pending",
      summary: lines.join(", "),
      pollIntervalMs: Math.max(
        30000,
        Number(data.poll_interval_seconds ?? 30) * 1000,
      ),
    };

    showModal.value = true;

    if (order.value.status === "paid") {
      // Already-paid booking (e.g. the page was refreshed after the payment
      // was confirmed). Never show the QR again — go straight to success.
      handlePaid();
    } else {
      startPolling();
    }
  } catch (e) {
    submitError.value = e.response?.data?.message || e.message || "Could not complete your booking.";
  } finally {
    submitting.value = false;
  }
}

function startPolling() {
  stopPolling();

  // Local countdown + expiry detection.
  countdownTimer = setInterval(() => {
    if (order.value?.status === "pending") {
      if (
        formatCountdown(order.value.expiresAt) === "00:00" &&
        order.value.expiresAt
      ) {
        order.value.status = "expired";
        stopPolling();
      }
    }
  }, 1000);

  // Authoritative Bakong verification — backend asks Bakong (via the MD5 of
  // the KHQR) whether the customer has paid, then confirms booking + tickets.
  const intervalMs = order.value?.pollIntervalMs || 5000;
  verifyTimer = setInterval(verifyPayment, intervalMs);
}

async function verifyPayment() {
  if (!order.value || order.value.status !== "pending") return;

  try {
    const res = await confirmPayment(order.value.paymentId);
    const newStatus = res.data?.status || order.value.status;
    gatewayNotice.value = "";
    if (newStatus !== order.value.status) {
      order.value.status = newStatus;
    }
  } catch (e) {
    const status = e.response?.status;

    // Gateway down / Bakong rate limit (HTTP 502/503). We cannot confirm the
    // payment, so keep the QR but stop auto-polling — hammering a rate-limited
    // gateway can never succeed and burns the daily quota. The customer can
    // re-check manually once it recovers.
    if (status === 502 || status === 503) {
      const firstTime = !gatewayNotice.value;
      gatewayNotice.value =
        e.response?.data?.message ||
        "We can't reach the payment gateway right now. If you already paid, do NOT pay again — tap “Check again” in a moment.";
      stopPolling();
      if (firstTime) {
        toast(
          "Payment gateway is busy. Auto-checking paused to protect the daily limit.",
          "info",
        );
      }
    }
    // Any other transient/network error — the next poll retries.
  }

  // PAID: stop everything immediately. The modal's paid branch hides the QR,
  // disables the wallet deeplink and shows the success screen.
  if (order.value.status === "paid") {
    handlePaid();
  } else if (["expired", "failed", "cancelled"].includes(order.value.status)) {
    stopPolling();
    if (order.value.status === "expired" || order.value.status === "failed") {
      toast(`Payment ${order.value.status}. You can try again.`, "info");
    }
  }
}

/**
 * Manual "I have paid" re-check. Runs one verification now and, when the
 * gateway is healthy and the payment is still pending, resumes auto-polling.
 */
async function checkNow() {
  await verifyPayment();
  if (order.value?.status === "pending" && !gatewayNotice.value) {
    startPolling();
  }
}

function stopPolling() {
  if (countdownTimer) clearInterval(countdownTimer);
  if (verifyTimer) clearInterval(verifyTimer);
  countdownTimer = null;
  verifyTimer = null;
}

/**
 * Called the moment Bakong confirms the payment. Stops all polling/countdown
 * and flips the order to "paid". The modal immediately swaps the QR for the
 * "Payment Successful" screen. The booking stays in sessionStorage so a later
 * refresh + re-click returns the same PAID payment (no duplicate payment,
 * tickets or QR).
 */
function handlePaid() {
  stopPolling();
  if (order.value) order.value.status = "paid";
  toast("Payment Successful — your ticket is ready!", "success");
}

function viewTickets() {
  stopPolling();
  if (order.value?.booking_id) {
    clearStoredBooking(event.value.id);
  }
  router.push("/my-tickets");
}

function closeModal() {
  stopPolling();
  showModal.value = false;
  if (!order.value) return;

  if (order.value.status === "paid") {
    // Payment already confirmed — show the inline success block on the page
    // instead of the booking form. The QR is never re-shown for this booking.
    success.value = {
      booking_number: order.value.bookingNumber || "",
      total_amount: order.value.amount || 0,
    };
  } else if (order.value.status === "pending") {
    toast("Payment cancelled. You can retry from this page.", "info");
  }
}

function handleRetry() {
  showModal.value = false;
  stopPolling();
  order.value = null;
  // Reuses the same pending booking_id via sessionStorage — the backend
  // issues a new payment (and new QR) only when the previous one expired.
  doCheckout();
}

onMounted(() => load(route.params.id));
onBeforeUnmount(stopPolling);
</script>

<template>
  <div class="px-4 pb-20 pt-24 sm:px-6 lg:px-8">
    <div class="mx-auto w-full max-w-5xl">
      <button
        type="button"
        class="mb-5 inline-flex items-center gap-1.5 text-sm text-slate-500 dark:text-[#9CA3AF] transition hover:text-slate-900 dark:hover:text-white"
        @click="router.push(`/events/${route.params.id}`)"
      >
        <ChevronLeft :size="16" />
        {{ t('backToEvent') }}
      </button>

      <div v-if="loading" class="animate-pulse space-y-4">
        <div class="h-32 rounded-2xl bg-white dark:bg-[#14171C]"></div>
        <div class="h-72 rounded-2xl bg-white dark:bg-[#14171C]"></div>
      </div>

      <div
        v-else-if="error"
        class="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-8 text-center text-red-300"
      >
        {{ error }}
      </div>

      <div
        v-else-if="success"
        class="mx-auto mt-6 max-w-lg rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-8 text-center"
      >
        <span
          class="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-300"
        >
          <Check :size="26" />
        </span>
        <h2 class="mt-4 text-xl font-bold text-white">Booking Confirmed!</h2>
        <p class="mt-2 text-sm text-[#9CA3AF]">
          Your booking reference is
          <span class="font-semibold text-white">{{ success.booking_number }}</span>
          for {{ formatPrice(success.total_amount) }}.
        </p>
        <div class="mt-6 flex justify-center gap-3">
          <button
            type="button"
            class="rounded-full bg-[#FFA500] px-5 py-2.5 text-sm font-bold text-black transition hover:bg-[#FFB52E]"
            @click="router.push('/my-tickets')"
          >
            {{ t('viewMyTickets') }}
          </button>
          <button
            type="button"
            class="rounded-full border border-slate-200 dark:border-white/15 bg-slate-100 dark:bg-white/5 px-5 py-2.5 text-sm font-semibold text-slate-900 dark:text-white transition hover:bg-slate-200 dark:hover:bg-white/10"
            @click="router.push('/home')"
          >
            {{ t('backHome') }}
          </button>
        </div>
      </div>

      <template v-else-if="event">
        <div class="grid gap-8 lg:grid-cols-[1fr_340px]">
          <!-- Ticket selection -->
          <section class="rounded-2xl border border-white/10 bg-[#14171C] p-6">
            <h1 class="text-xl font-extrabold text-white sm:text-2xl">Book Tickets</h1>
            <p class="mt-1 text-sm text-[#9CA3AF]">{{ event.title }}</p>

            <div class="mt-6 space-y-3">
              <div
                v-for="ticket in ticketTypes"
                :key="ticket.id"
                class="rounded-xl border border-slate-200 dark:border-white/10 bg-slate-200 dark:bg-[#1D2229] p-4"
              >
                <div class="flex items-center justify-between gap-3">
                  <div>
                    <p class="text-sm font-semibold text-white">{{ ticket.name }}</p>
                    <p class="mt-0.5 text-sm font-bold text-[#FFA500]">{{ formatPrice(ticket.price) }}</p>
                  </div>

                  <div class="flex items-center gap-2">
                    <button
                      type="button"
                      class="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 dark:border-white/15 bg-slate-100 dark:bg-white/5 text-slate-900 dark:text-white transition hover:bg-slate-200 dark:hover:bg-white/10"
                      :aria-label="t('decreaseQuantity', { name: ticket.name })"
                      @click="decrement(ticket)"
                    >
                      <Minus :size="14" />
                    </button>
                    <span class="w-8 text-center text-sm font-semibold text-white">
                      {{ quantities[ticket.id] || 0 }}
                    </span>
                    <button
                      type="button"
                      class="flex h-8 w-8 items-center justify-center rounded-full border border-white/15 bg-white/5 text-white transition hover:bg-white/10 disabled:opacity-40"
                      :aria-label="`Increase ${ticket.name} quantity`"
                      :disabled="Number(quantities[ticket.id] || 0) >= availableFor(ticket)"
                      @click="increment(ticket)"
                    >
                      <Plus :size="14" />
                    </button>
                  </div>
                </div>

                <p
                  v-if="ticket.quantity !== undefined"
                  class="mt-2 text-xs text-slate-500 dark:text-[#9CA3AF]"
                  :class="availableFor(ticket) === 0 ? 'text-red-400' : ''"
                >
                  {{ availableFor(ticket) > 0 ? `${availableFor(ticket)} available` : "Sold out" }}
                </p>
              </div>

              <p
                v-if="!ticketTypes.length"
                class="rounded-lg bg-slate-100 dark:bg-white/5 px-4 py-6 text-center text-sm text-slate-500 dark:text-[#9CA3AF]"
              >
                {{ t('noTicketsAvailable') }}
              </p>
            </div>

            <p
              v-if="submitError"
              class="mt-4 rounded-lg bg-red-500/10 px-3 py-2 text-xs text-red-300"
            >
              {{ submitError }}
            </p>
          </section>

          <!-- Summary -->
          <aside class="h-fit rounded-2xl border border-white/10 bg-[#14171C] p-5 lg:sticky lg:top-24">
            <div class="flex gap-3">
              <span class="h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-[#1D2229]">
                <img
                  v-if="coverImage(event)"
                  :src="coverImage(event)"
                  :alt="event.title"
                  class="h-full w-full object-cover"
                />
              </span>
              <div class="min-w-0">
                <p class="line-clamp-1 text-sm font-bold text-white">{{ event.title }}</p>
                <p class="mt-1 text-xs text-[#9CA3AF]">
                  {{ formatDate(event.start_date) }} · {{ formatTime(event.start_time) }}
                </p>
                <p class="mt-1 text-xs text-[#9CA3AF]">{{ event.venue?.name }}</p>
              </div>
            </div>

            <div class="mt-5 flex items-center justify-between border-t border-white/5 pt-4 text-sm">
              <span class="text-[#9CA3AF]">Total</span>
              <span class="text-lg font-extrabold text-[#FFA500]">{{ formatPrice(subtotal) }}</span>
            </div>

            <button
              type="button"
              :disabled="submitting || !hasSelection || !ticketTypes.length"
              class="mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-[#FFA500] px-6 py-3 text-sm font-bold text-black shadow-lg shadow-[#FFA500]/20 transition hover:bg-[#FFB52E] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
              @click="doCheckout"
            >
              <Loader2 v-if="submitting" :size="17" class="animate-spin" />
              <Ticket v-else :size="17" />
              {{ submitting ? t('processing') : t('confirmBooking') }}
            </button>

            <p class="mt-4 text-center text-xs text-slate-500 dark:text-[#9CA3AF]">
              {{ t('bookingConfirmation') }}
            </p>
          </aside>
        </div>
      </template>
    </div>

    <BakongPaymentModal
      v-model="showModal"
      :qr-payload="order?.qrPayload || ''"
      :deeplink="order?.deeplink || ''"
      :amount="order?.amount || 0"
      :currency="order?.currency || 'USD'"
      :expires-at="order?.expiresAt || ''"
      :summary="order?.summary || ''"
      :status="order?.status || 'pending'"
      :notice="gatewayNotice"
      @cancel="closeModal"
      @retry="handleRetry"
      @check="checkNow"
      @view-tickets="viewTickets"
    />
  </div>
</template>
