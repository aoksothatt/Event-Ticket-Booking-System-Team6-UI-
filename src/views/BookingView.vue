<script setup>
import { computed, onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import { Loader2, Ticket, ChevronLeft, Minus, Plus, Check } from "lucide-vue-next";
import { getEvent } from "../api/eventApi.js";
import { post } from "../api/http.js";
import { useAuthStore } from "../stores/auth.js";
import { coverImage, formatDate, formatTime, formatPrice } from "../utils/event.js";

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
    error.value = e.message || t('couldNotLoadEvent');
  } finally {
    loading.value = false;
  }
}

async function checkout() {
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
  try {
    const bookingResponse = await post("/bookings", {
      user_id: user.id,
      event_id: Number(event.value.id),
      items: selectedItems(),
    });
    const booking = bookingResponse?.data || bookingResponse;

    // Record a paid payment so the backend confirms the booking and
    // generates one actual Ticket record per purchased seat. Without this,
    // no tickets are created and they never show on the My Tickets page.
    await post("/payments", {
      booking_id: booking.id,
      payment_method: "card",
      amount: Number(booking.total_amount || subtotal.value),
      currency: "USD",
      payment_status: "paid",
    });

    success.value = booking;
  } catch (e) {
    submitError.value = e.response?.data?.message || e.message || t('couldNotCompleteBooking');
  } finally {
    submitting.value = false;
  }
}

onMounted(() => load(route.params.id));
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

      <!-- Success -->
      <div
        v-else-if="success"
        class="mx-auto mt-6 max-w-lg rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-8 text-center"
      >
        <span class="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-300">
          <Check :size="26" />
        </span>
        <h2 class="mt-4 text-xl font-bold text-slate-900 dark:text-white">{{ t('bookingConfirmed') }}</h2>
        <p class="mt-2 text-sm text-slate-500 dark:text-[#9CA3AF]">
          {{ t('bookingRefFor', { ref: success.booking_number, price: formatPrice(success.total_amount) }) }}
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
          <section class="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#14171C] p-6">
            <h1 class="text-xl font-extrabold text-slate-900 dark:text-white sm:text-2xl">{{ t('bookTickets') }}</h1>
            <p class="mt-1 text-sm text-slate-500 dark:text-[#9CA3AF]">{{ event.title }}</p>

            <div class="mt-6 space-y-3">
              <div
                v-for="ticket in ticketTypes"
                :key="ticket.id"
                class="rounded-xl border border-slate-200 dark:border-white/10 bg-slate-200 dark:bg-[#1D2229] p-4"
              >
                <div class="flex items-center justify-between gap-3">
                  <div>
                    <p class="text-sm font-semibold text-slate-900 dark:text-white">{{ ticket.name }}</p>
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
                    <span class="w-8 text-center text-sm font-semibold text-slate-900 dark:text-white">
                      {{ quantities[ticket.id] || 0 }}
                    </span>
                    <button
                      type="button"
                      class="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 dark:border-white/15 bg-slate-100 dark:bg-white/5 text-slate-900 dark:text-white transition hover:bg-slate-200 dark:hover:bg-white/10 disabled:opacity-40"
                      :aria-label="t('increaseQuantity', { name: ticket.name })"
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
                  {{ availableFor(ticket) > 0 ? `${availableFor(ticket)} ${t('available')}` : t('soldOut') }}
                </p>
              </div>

              <p
                v-if="!ticketTypes.length"
                class="rounded-lg bg-slate-100 dark:bg-white/5 px-4 py-6 text-center text-sm text-slate-500 dark:text-[#9CA3AF]"
              >
                {{ t('noTicketsAvailable') }}
              </p>
            </div>

            <p v-if="submitError" class="mt-4 rounded-lg bg-red-500/10 px-3 py-2 text-xs text-red-300">
              {{ submitError }}
            </p>
          </section>

          <!-- Summary -->
          <aside class="h-fit rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#14171C] p-5 lg:sticky lg:top-24">
            <div class="flex gap-3">
              <span class="h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-slate-200 dark:bg-[#1D2229]">
                <img
                  v-if="coverImage(event)"
                  :src="coverImage(event)"
                  :alt="event.title"
                  class="h-full w-full object-cover"
                />
              </span>
              <div class="min-w-0">
                <p class="line-clamp-1 text-sm font-bold text-slate-900 dark:text-white">{{ event.title }}</p>
                <p class="mt-1 text-xs text-slate-500 dark:text-[#9CA3AF]">
                  {{ formatDate(event.start_date) }} · {{ formatTime(event.start_time) }}
                </p>
                <p class="mt-1 text-xs text-slate-500 dark:text-[#9CA3AF]">{{ event.venue?.name }}</p>
              </div>
            </div>

            <div class="mt-5 flex items-center justify-between border-t border-slate-200 dark:border-white/5 pt-4 text-sm">
              <span class="text-slate-500 dark:text-[#9CA3AF]">{{ t('total') }}</span>
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
              {{ submitting ? t('processing') : t('confirmBooking') }}
            </button>

            <p class="mt-4 text-center text-xs text-slate-500 dark:text-[#9CA3AF]">
              {{ t('bookingConfirmation') }}
            </p>
          </aside>
        </div>
      </template>
    </div>
  </div>
</template>
