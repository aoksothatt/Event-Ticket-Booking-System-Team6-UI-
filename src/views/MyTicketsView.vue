<script setup>
import { computed, onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { Ticket, QrCode, Calendar, MapPin, TicketCheck } from "lucide-vue-next";
import { getMyTicketsData } from "../api/bookingApi.js";
import { coverImage, formatDate, formatTime } from "../utils/event.js";

const router = useRouter();
const tickets = ref([]);
const loading = ref(true);
const error = ref("");
const selected = ref(null);

const statusStyles = {
  active: "bg-emerald-500/15 text-emerald-300 border-emerald-500/20",
  used: "bg-sky-500/15 text-sky-300 border-sky-500/20",
  cancelled: "bg-red-500/15 text-red-300 border-red-500/20",
  expired: "bg-amber-500/15 text-amber-300 border-amber-500/20",
};

function statusClass(status) {
  return statusStyles[status?.toLowerCase()] || "bg-white/10 text-white/70 border-white/10";
}

// Public QR renderer with graceful text fallback.
function qrImageUrl(ticket) {
  const token = ticket?.qr_token || ticket?.ticket_code || "";
  return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent("/api/tickets/verify?qr_token=" + token)}`;
}

const groupedByBooking = computed(() => {
  const map = new Map();
  for (const t of tickets.value) {
    const key = t?.booking_id ?? "unknown";
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(t);
  }
  return [...map.values()];
});

async function load() {
  loading.value = true;
  error.value = "";
  try {
    tickets.value = await getMyTicketsData();
  } catch (e) {
    error.value = e.response?.data?.message || e.message || "Could not load your tickets.";
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
          <p class="mt-1 text-sm text-[#9CA3AF]">Each purchased seat gets its own ticket with a unique code.</p>
        </div>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="grid gap-4 md:grid-cols-2">
        <div v-for="n in 4" :key="n" class="h-52 animate-pulse rounded-2xl bg-[#14171C]"></div>
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
          When you successfully pay for a booking, your tickets will appear here.
        </p>
        <button
          type="button"
          class="mt-5 rounded-full bg-[#FFA500] px-6 py-2.5 text-sm font-semibold text-black transition hover:bg-[#FFB52E]"
          @click="router.push('/events')"
        >
          Browse Events
        </button>
      </div>

      <!-- Tickets grouped by booking -->
      <div v-else class="space-y-6">
        <section v-for="(group, gi) in groupedByBooking" :key="gi">
          <div class="mb-3 flex items-center gap-2 text-xs font-semibold text-[#9CA3AF]">
            <TicketCheck :size="14" class="text-[#FFA500]" />
            Booking {{ group[0].booking?.booking_number || `#${group[0].booking_id}` }}
          </div>

          <div class="grid gap-4 md:grid-cols-2">
            <article
              v-for="ticket in group"
              :key="ticket.id"
              class="flex overflow-hidden rounded-2xl border border-white/10 bg-[#14171C] transition hover:border-[#FFA500]/30"
            >
              <!-- Cover -->
              <div class="w-28 shrink-0 overflow-hidden sm:w-32">
                <img
                  v-if="coverImage(ticket.ticket_type?.event)"
                  :src="coverImage(ticket.ticket_type.event)"
                  :alt="ticket.ticket_type?.event?.title"
                  class="h-full w-full object-cover"
                />
                <div v-else class="flex h-full items-center justify-center bg-[#1D2229]">
                  <Ticket :size="20" class="text-white/20" />
                </div>
              </div>

              <!-- Body -->
              <div class="flex min-w-0 flex-1 flex-col p-4">
                <div class="flex items-start justify-between gap-2">
                  <div class="min-w-0">
                    <p class="line-clamp-1 text-sm font-bold text-white">
                      {{ ticket.ticket_type?.event?.title || "Event" }}
                    </p>
                    <p class="mt-0.5 text-xs font-semibold text-[#FFA500]">
                      {{ ticket.ticket_type?.name || "Ticket" }}
                    </p>
                  </div>
                  <span
                    class="shrink-0 rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider"
                    :class="statusClass(ticket.status)"
                  >
                    {{ ticket.status }}
                  </span>
                </div>

                <div class="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#9CA3AF]">
                  <span v-if="ticket.ticket_type?.event?.start_date" class="flex items-center gap-1">
                    <Calendar :size="12" />
                    {{ formatDate(ticket.ticket_type.event.start_date) }}
                  </span>
                  <span v-if="ticket.ticket_type?.event?.venue?.name" class="flex items-center gap-1">
                    <MapPin :size="12" />
                    <span class="truncate">{{ ticket.ticket_type.event.venue.name }}</span>
                  </span>
                </div>

                <div class="mt-3 flex items-center justify-between gap-2 border-t border-white/5 pt-3">
                  <div class="min-w-0">
                    <p class="text-[10px] uppercase tracking-wider text-[#9CA3AF]">Ticket Code</p>
                    <p class="truncate font-mono text-sm font-bold text-white">{{ ticket.ticket_code }}</p>
                  </div>
                  <button
                    type="button"
                    class="flex shrink-0 items-center gap-1.5 rounded-lg bg-white/5 px-3 py-2 text-xs font-semibold text-white/80 transition hover:bg-white/10 hover:text-white"
                    @click="selected = selected?.id === ticket.id ? null : ticket"
                  >
                    <QrCode :size="14" />
                    {{ selected?.id === ticket.id ? "Hide QR" : "Show QR" }}
                  </button>
                </div>

                <transition
                  enter-active-class="transition duration-150 ease-out"
                  enter-from-class="opacity-0 -translate-y-1"
                  enter-to-class="opacity-100 translate-y-0"
                  leave-active-class="transition duration-100 ease-in"
                  leave-from-class="opacity-100"
                  leave-to-class="opacity-0"
                >
                  <div v-if="selected?.id === ticket.id" class="mt-3 flex items-center gap-3 rounded-xl bg-[#1D2229] p-3">
                    <div class="shrink-0 overflow-hidden rounded-lg bg-white p-1">
                      <img
                        :src="qrImageUrl(ticket)"
                        alt="Ticket QR code"
                        class="h-24 w-24 object-contain"
                      />
                    </div>
                    <div class="min-w-0 text-xs text-[#9CA3AF]">
                      <p class="font-semibold text-white">Show this QR at the venue</p>
                      <p class="mt-1 break-all font-mono text-[10px]">
                        {{ ticket.ticket_code }}
                      </p>
                      <p class="mt-1">Verified by staff at entry.</p>
                    </div>
                  </div>
                </transition>
              </div>
            </article>
          </div>
        </section>
      </div>
    </div>
  </div>
</template>