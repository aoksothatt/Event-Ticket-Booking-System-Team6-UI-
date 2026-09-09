<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { Loader2, Ticket, ChevronLeft, Minus, Plus, Check } from "lucide-vue-next";
import QRCode from "qrcode";
import { getEvent } from "../api/eventApi.js";
import { createBakongCheckout, verifyPayment, formatCountdown } from "../api/bakongApi.js";
import { useAuthStore } from "../stores/auth.js";
import { coverImage, formatDate, formatTime, formatPrice } from "../utils/event.js";

const route = useRoute();
const router = useRouter();
const auth = useAuthStore();

const event = ref(null);
const loading = ref(true);
const error = ref("");
const submitting = ref(false);
const submitError = ref("");
const success = ref(null);
const paying = ref(false);
const paymentItems = ref([]);

let countdownTimer = null;
let verifyTimer = null;

const quantities = ref({});

const ticketTypes = computed(() => event.value?.ticketTypes || event.value?.ticket_types || []);

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
    .map(([id, qty]) => ({ ticket_type_id: Number(id), quantity: Number(qty) }));
}

const subtotal = computed(() =>
  ticketTypes.value.reduce((sum, t) => {
    const qty = Number(quantities.value[t.id] || 0);
    const max = Math.max(0, Number(t.quantity || 0) - Number(t.sold_quantity || 0));
    const effective = Math.min(qty, max);
    return sum + Number(t.price || 0) * effective;
  }, 0)
);

const hasSelection = computed(() => selectedItems().length > 0);

function availableFor(ticket) {
  if (ticket.quantity === undefined || ticket.quantity === null) return Infinity;
  return Math.max(0, Number(ticket.quantity) - Number(ticket.sold_quantity || 0));
}

function increment(t) {
  const max = availableFor(t);
  quantities.value[t.id] = Math.min(Number(quantities.value[t.id] || 0) + 1, max || 1);
}

function decrement(t) {
  quantities.value[t.id] = Math.max(0, Number(quantities.value[t.id] || 0) - 1);
}

async function load(id) {
  loading.value = true;
  error.value = "";
  try {
    event.value = await getEvent(id);
    ensureQuantities();
  } catch (e) {
    error.value = e.message || "Could not load this event.";
  } finally {
    loading.value = false;
  }
}

async function checkout() {
  submitError.value = "";
  if (!hasSelection.value) {
    submitError.value = "Please select at least one ticket.";
    return;
  }
  const user = auth.user;
  if (!user?.id) {
    submitError.value = "Please sign in to book tickets.";
    return;
  }

  submitting.value = true;
  try {
    // One Bakong checkout per selected ticket type. Each returns its own
    // pending payment + KHQR payload. Polling + verify are started below.
    const created = [];
    for (const item of selectedItems()) {
      const res = await createBakongCheckout({
        event_id: Number(event.value.id),
        ticket_type_id: item.ticket_type_id,
        quantity: item.quantity,
      });
      const data = res.data;
      const ticketType = ticketTypes.value.find((t) => t.id === Number(item.ticket_type_id));
      created.push({
        ticketName: ticketType?.name || `Ticket #${item.ticket_type_id}`,
        quantity: item.quantity,
        paymentId: data.payment.id,
        bookingNumber: data.booking.booking_number,
        amount: Number(data.amount),
        currency: data.currency,
        qrPayload: data.qr_payload,
        expiresAt: data.expires_at,
        qrDataUrl: null,
        status: "pending",
        countdown: formatCountdown(data.expires_at),
      });
    }

    paymentItems.value = created;
    paying.value = true;
    renderQrCodes();
    startPolling();
  } catch (e) {
    submitError.value = e.response?.data?.message || e.message || "Could not initiate payment.";
  } finally {
    submitting.value = false;
  }
}

async function renderQrCodes() {
  await Promise.all(
    paymentItems.value.map(async (item) => {
      item.qrDataUrl = await QRCode.toDataURL(item.qrPayload, {
        errorCorrectionLevel: "H",
        width: 240,
        margin: 1,
      });
    })
  );
}

// The backend's `status` endpoint is local-only; `verify` is what actually
// asks Bakong whether the transaction completed. Poll verify on an interval
// (idempotent server-side) and keep it running until every payment resolves.
function startPolling() {
  stopPolling();

  countdownTimer = setInterval(() => {
    for (const item of paymentItems.value) {
      item.countdown = formatCountdown(item.expiresAt);
      if (item.countdown === "00:00" && item.status === "pending") {
        verifyAll();
      }
    }
  }, 1000);

  verifyTimer = setInterval(verifyAll, 15000);
}

async function verifyAll() {
  for (const item of paymentItems.value) {
    if (item.status === "paid" || item.status === "expired" || item.status === "failed") continue;
    try {
      const res = await verifyPayment(item.paymentId);
      item.status = res.data?.status || item.status;
    } catch {
      // Transient/network error — the next poll will retry.
    }
  }
  if (allPaid.value) {
    finish();
  }
}

function stopPolling() {
  if (countdownTimer) clearInterval(countdownTimer);
  if (verifyTimer) clearInterval(verifyTimer);
  countdownTimer = null;
  verifyTimer = null;
}

const allPaid = computed(
  () => paymentItems.value.length > 0 && paymentItems.value.every((p) => p.status === "paid")
);

const totalPaid = computed(() =>
  paymentItems.value.reduce((sum, p) => sum + Number(p.amount || 0), 0)
);

function finish() {
  stopPolling();
  success.value = {
    booking_number: paymentItems.value.map((p) => p.bookingNumber).filter(Boolean).join(", "),
    total_amount: totalPaid.value,
  };
}

onMounted(() => load(route.params.id));
onBeforeUnmount(stopPolling);
</script>

<template>
  <div class="px-4 pb-20 pt-24 sm:px-6 lg:px-8">
    <div class="mx-auto w-full max-w-5xl">
      <button
        type="button"
        class="mb-5 inline-flex items-center gap-1.5 text-sm text-[#9CA3AF] transition hover:text-white"
        @click="router.push(`/events/${route.params.id}`)"
      >
        <ChevronLeft :size="16" />
        Back to event
      </button>

      <div v-if="loading" class="animate-pulse space-y-4">
        <div class="h-32 rounded-2xl bg-[#14171C]"></div>
        <div class="h-72 rounded-2xl bg-[#14171C]"></div>
      </div>

      <div
        v-else-if="error"
        class="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-8 text-center text-red-300"
      >
        {{ error }}
      </div>

      <!-- Success -->
      <div
        v-else-if="success"
        class="mx-auto mt-6 max-w-lg rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-8 text-center"
      >
        <span class="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-300">
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
            View My Tickets
          </button>
          <button
            type="button"
            class="rounded-full border border-white/15 bg-white/5 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"
            @click="router.push('/home')"
          >
            Back Home
          </button>
        </div>
      </div>

      <!-- Pay with Bakong KHQR -->
      <div
        v-else-if="paying"
        class="mx-auto mt-6 max-w-lg space-y-4"
      >
        <div
          v-for="(item, idx) in paymentItems"
          :key="idx"
          class="rounded-2xl border border-white/10 bg-[#14171C] p-6 text-center"
        >
          <div class="flex items-center justify-between">
            <p class="text-sm font-semibold text-white">{{ item.ticketName }} × {{ item.quantity }}</p>
            <p class="text-sm font-bold text-[#FFA500]">{{ formatPrice(item.amount) }}</p>
          </div>

          <div class="my-4 flex justify-center">
            <img
              v-if="item.qrDataUrl"
              :src="item.qrDataUrl"
              alt="KHQR payment code"
              class="rounded-xl border border-white/10 bg-white p-2"
            />
            <Loader2 v-else :size="28" class="animate-spin text-[#FFA500]" />
          </div>

          <p class="text-sm text-[#9CA3AF]">
            Scan with the Bakong / ABA / WING app.<br />
            Expires in <span class="font-mono font-bold text-white">{{ item.countdown }}</span>
          </p>

          <p
            class="mt-3 inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold"
            :class="{
              'bg-amber-500/10 text-amber-300': item.status === 'pending',
              'bg-emerald-500/10 text-emerald-300': item.status === 'paid',
              'bg-red-500/10 text-red-300': item.status === 'expired' || item.status === 'failed',
            }"
          >
            <Loader2 v-if="item.status === 'pending'" :size="12" class="animate-spin" />
            {{ item.status === 'paid' ? 'Paid' : item.status === 'expired' ? 'Expired' : item.status === 'failed' ? 'Failed' : 'Awaiting payment…' }}
          </p>
        </div>

        <p v-if="submitError" class="rounded-lg bg-red-500/10 px-3 py-2 text-xs text-red-300">
          {{ submitError }}
        </p>
        <p class="text-center text-xs text-[#9CA3AF]">
          We check your payment automatically. It may take a few seconds to confirm.
        </p>
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
                class="rounded-xl border border-white/10 bg-[#1D2229] p-4"
              >
                <div class="flex items-center justify-between gap-3">
                  <div>
                    <p class="text-sm font-semibold text-white">{{ ticket.name }}</p>
                    <p class="mt-0.5 text-sm font-bold text-[#FFA500]">{{ formatPrice(ticket.price) }}</p>
                  </div>

                  <div class="flex items-center gap-2">
                    <button
                      type="button"
                      class="flex h-8 w-8 items-center justify-center rounded-full border border-white/15 bg-white/5 text-white transition hover:bg-white/10"
                      :aria-label="`Decrease ${ticket.name} quantity`"
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
                  class="mt-2 text-xs text-[#9CA3AF]"
                  :class="availableFor(ticket) === 0 ? 'text-red-400' : ''"
                >
                  {{ availableFor(ticket) > 0 ? `${availableFor(ticket)} available` : "Sold out" }}
                </p>
              </div>

              <p
                v-if="!ticketTypes.length"
                class="rounded-lg bg-white/5 px-4 py-6 text-center text-sm text-[#9CA3AF]"
              >
                No ticket options are available for this event yet.
              </p>
            </div>

            <p v-if="submitError" class="mt-4 rounded-lg bg-red-500/10 px-3 py-2 text-xs text-red-300">
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
              @click="checkout"
            >
              <Loader2 v-if="submitting" :size="17" class="animate-spin" />
              <Ticket v-else :size="17" />
              {{ submitting ? "Processing..." : "Confirm Booking" }}
            </button>

            <p class="mt-4 text-center text-xs text-[#9CA3AF]">
              You'll receive a confirmation with your booking reference.
            </p>
          </aside>
        </div>
      </template>
    </div>
  </div>
</template>
