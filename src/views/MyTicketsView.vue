<script setup>
import { computed, onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { Ticket, QrCode, Calendar, MapPin, ChevronRight } from "lucide-vue-next";
import { getMyTickets } from "../api/bookingApi.js";
import { coverImage, formatDate, formatTime, formatPrice } from "../utils/event.js";

const router = useRouter();
const tickets = ref([]);
const loading = ref(true);
const error = ref("");

const statusStyles = {
  confirmed: "bg-emerald-500/15 text-emerald-300",
  pending: "bg-amber-500/15 text-amber-300",
  cancelled: "bg-red-500/15 text-red-300",
  completed: "bg-sky-500/15 text-sky-300",
};

function statusClass(status) {
  return statusStyles[status?.toLowerCase()] || "bg-white/10 text-white/70";
}

const totalSpent = computed(() =>
  tickets.value.reduce((sum, t) => sum + Number(t.total_amount || 0), 0)
);

async function load() {
  loading.value = true;
  error.value = "";
  try {
    tickets.value = await getMyTickets();
  } catch (e) {
    error.value = e.message || "Could not load your tickets.";
  } finally {
    loading.value = false;
  }
}

onMounted(load);
</script>

<template>
  <div class="px-4 pb-20 pt-28 sm:px-6 lg:px-8">
    <div class="mx-auto w-full max-w-6xl">
      <div class="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 class="text-2xl font-extrabold tracking-tight text-white sm:text-3xl">My Tickets</h1>
          <p class="mt-1 text-sm text-[#9CA3AF]">All of your bookings in one place.</p>
        </div>
        <div
          v-if="tickets.length"
          class="rounded-2xl border border-white/10 bg-[#14171C] px-5 py-3 text-center"
        >
          <p class="text-xs text-[#9CA3AF]">Total spent</p>
          <p class="text-lg font-bold text-[#FFA500]">{{ formatPrice(totalSpent) }}</p>
        </div>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="grid gap-4 md:grid-cols-2">
        <div v-for="n in 4" :key="n" class="h-40 animate-pulse rounded-2xl bg-[#14171C]"></div>
      </div>

      <!-- Error -->
      <div
        v-else-if="error"
        class="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-8 text-center text-red-300"
      >
        {{ error }}
      </div>

      <!-- Empty state -->
      <div
        v-else-if="!tickets.length"
        class="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 bg-[#14171C]/50 px-6 py-16 text-center"
      >
        <span class="flex h-14 w-14 items-center justify-center rounded-full bg-white/5 text-white/40">
          <Ticket :size="26" />
        </span>
        <h2 class="mt-4 text-lg font-bold text-white">No tickets yet</h2>
        <p class="mt-1 max-w-sm text-sm text-[#9CA3AF]">
          When you book an event, your tickets will appear here.
        </p>
        <button
          type="button"
          class="mt-5 rounded-full bg-[#FFA500] px-6 py-2.5 text-sm font-semibold text-black transition hover:bg-[#FFB52E]"
          @click="router.push('/events')"
        >
          Browse Events
        </button>
      </div>

      <!-- Tickets -->
      <div v-else class="grid gap-4 md:grid-cols-2">
        <article
          v-for="booking in tickets"
          :key="booking.id"
          class="group flex overflow-hidden rounded-2xl border border-white/10 bg-[#14171C] transition hover:border-[#FFA500]/30"
        >
          <!-- Cover -->
          <div class="w-28 shrink-0 overflow-hidden sm:w-32">
            <img
              v-if="coverImage(booking.event)"
              :src="coverImage(booking.event)"
              :alt="booking.event?.title"
              class="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <div v-else class="flex h-full w-full items-center justify-center bg-[#1D2229]">
              <Ticket :size="20" class="text-white/20" />
            </div>
          </div>

          <!-- Body -->
          <div class="flex min-w-0 flex-1 flex-col p-4">
            <div class="flex items-start justify-between gap-2">
              <div class="min-w-0">
                <h3 class="line-clamp-1 text-sm font-bold text-white">{{ booking.event?.title || "Event" }}</h3>
                <div class="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#9CA3AF]">
                  <span v-if="booking.event?.start_date" class="flex items-center gap-1">
                    <Calendar :size="12" />
                    {{ formatDate(booking.event.start_date) }}
                  </span>
                  <span v-if="booking.event?.venue?.name" class="flex items-center gap-1">
                    <MapPin :size="12" />
                    <span class="truncate">{{ booking.event.venue.name }}</span>
                  </span>
                </div>
              </div>
              <span
                class="shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider"
                :class="statusClass(booking.status)"
              >
                {{ booking.status }}
              </span>
            </div>

            <div class="mt-3 flex items-center justify-between border-t border-white/5 pt-3">
              <div>
                <p class="text-xs text-[#9CA3AF]">{{ booking.booking_number }}</p>
                <p class="mt-0.5 text-sm font-bold text-[#FFA500]">{{ formatPrice(booking.total_amount) }}</p>
              </div>
              <button
                type="button"
                class="flex items-center gap-1 rounded-lg bg-white/5 px-3 py-1.5 text-xs font-semibold text-white/70 transition hover:bg-white/10 hover:text-white"
                @click="router.push(`/events/${booking.event_id}?from=booking`)"
              >
                <QrCode :size="13" />
                View
                <ChevronRight :size="13" />
              </button>
            </div>
          </div>
        </article>
      </div>
    </div>
  </div>
</template>
