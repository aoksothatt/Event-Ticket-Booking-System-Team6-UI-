<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import {
  Loader2,
  CheckCircle2,
  XCircle,
  Ticket,
  ScanLine,
  Clock,
  MapPin,
} from "lucide-vue-next";
import { selfCheckIn } from "../api/checkInApi.js";
import { formatDate, formatTime, coverImage } from "../utils/event.js";
import QRCodeScanner from "../components/ticket/QRCodeScanner.vue";

const route = useRoute();
const router = useRouter();

function formatDateTime(value) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

const state = ref("idle"); // idle | loading | success | error
const message = ref("");
const ticket = ref(null);
const checkIn = ref(null);
const manualCode = ref("");
const scanKey = ref(0);
const redirectCountdown = ref(0);

let redirectTimer = null;

function checkAgain() {
  clearRedirectTimer();
  state.value = "idle";
  message.value = "";
  ticket.value = null;
  checkIn.value = null;
  manualCode.value = "";
  scanKey.value += 1;
}

function clearRedirectTimer() {
  if (redirectTimer) {
    clearInterval(redirectTimer);
    redirectTimer = null;
  }
  redirectCountdown.value = 0;
}

/**
 * After a successful check-in the scan page "turns off": wait a moment so the
 * success state is visible, then go to the My Tickets list where the ticket
 * now shows as "Used".
 */
function goToMyTickets() {
  clearRedirectTimer();
  router.replace("/my-tickets");
}

function scheduleMyTicketsRedirect() {
  redirectCountdown.value = 3;
  redirectTimer = setInterval(() => {
    redirectCountdown.value -= 1;
    if (redirectCountdown.value <= 0) {
      goToMyTickets();
    }
  }, 1000);
}

function onScanned(raw) {
  if (raw && raw.trim()) {
    manualCode.value = raw.trim();
    doCheckIn(raw.trim());
  }
}

const ticketToken = computed(() => route.query?.ticket || route.query?.qr_token || "");

async function doCheckIn(code = ticketToken.value) {
  const value = String(code || "").trim();
  if (!value) {
    state.value = "error";
    message.value = "No ticket code found. Scan your QR code again.";
    return;
  }

  state.value = "loading";
  message.value = "";
  try {
    const res = await selfCheckIn(value);
    ticket.value = res?.data || null;
    checkIn.value = res?.check_in || null;
    state.value = "success";
    message.value = res?.message || "Check-in successful. Enjoy the event!";
    scheduleMyTicketsRedirect();
  } catch (e) {
    state.value = "error";
    ticket.value = null;
    message.value = e.response?.data?.message || e.message || "Could not complete check-in.";
  }
}

function submitManual() {
  if (!manualCode.value.trim()) return;
  doCheckIn(manualCode.value);
}

onMounted(() => {
  if (ticketToken.value) {
    doCheckIn();
  }
});

onBeforeUnmount(clearRedirectTimer);
</script>

<template>
  <div class="min-h-screen bg-[#0C0E12] px-4 py-10 text-white">
    <div class="mx-auto w-full max-w-md">
      <!-- Header -->
      <div class="text-center">
        <span
          class="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-[#14171C]"
        >
          <ScanLine :size="28" class="text-[#FFA500]" />
        </span>
        <h1 class="mt-4 text-xl font-extrabold tracking-tight">Self Check-In</h1>
        <p class="mt-1 text-sm text-[#9CA3AF]">Scan your ticket QR at the venue entrance.</p>
      </div>

      <!-- Success -->
      <div
        v-if="state === 'success'"
        class="mt-8 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-6 text-center"
      >
        <span class="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-300">
          <CheckCircle2 :size="30" />
        </span>
        <h2 class="mt-4 text-xl font-bold text-white">{{ message }}</h2>

        <div v-if="ticket" class="mt-6 space-y-3 rounded-xl bg-[#14171C] p-4 text-left">
          <div class="flex gap-3">
            <span class="h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-[#1D2229]">
              <img
                v-if="coverImage(ticket.ticket_type?.event)"
                :src="coverImage(ticket.ticket_type.event)"
                :alt="ticket.ticket_type?.event?.title"
                class="h-full w-full object-cover"
              />
            </span>
            <div class="min-w-0">
              <p class="line-clamp-1 text-sm font-bold">
                {{ ticket.ticket_type?.event?.title || "Event" }}
              </p>
              <p class="mt-0.5 text-xs font-semibold text-[#FFA500]">
                {{ ticket.ticket_type?.name || "Ticket" }}
              </p>
              <p class="mt-1 truncate font-mono text-[10px] text-[#9CA3AF]">
                {{ ticket.ticket_code }}
              </p>
            </div>
          </div>

          <div class="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#9CA3AF]">
            <span v-if="ticket.ticket_type?.event?.start_date" class="flex items-center gap-1">
              <Clock :size="12" />
              {{ formatDate(ticket.ticket_type.event.start_date) }} · {{ formatTime(ticket.ticket_type.event.start_time) }}
            </span>
            <span v-if="ticket.ticket_type?.event?.venue?.name" class="flex items-center gap-1">
              <MapPin :size="12" />
              <span class="truncate">{{ ticket.ticket_type.event.venue.name }}</span>
            </span>
          </div>

          <p v-if="checkIn" class="border-t border-white/5 pt-3 text-[10px] uppercase tracking-wider text-[#9CA3AF]">
            Checked in at {{ formatDateTime(checkIn.checked_in_at) }}
          </p>
        </div>

        <button
          type="button"
          class="mt-6 rounded-full bg-[#FFA500] px-6 py-2.5 text-sm font-bold text-black transition hover:bg-[#FFB52E]"
          @click="goToMyTickets"
        >
          View My Tickets
        </button>

        <p class="mt-3 text-xs text-[#9CA3AF]">
          <template v-if="redirectCountdown > 0">
            Closing this page and opening My Tickets in {{ redirectCountdown }}s…
          </template>
        </p>
      </div>

      <!-- Error -->
      <div
        v-else-if="state === 'error'"
        class="mt-8 rounded-2xl border border-red-500/30 bg-red-500/10 p-6 text-center"
      >
        <span class="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-500/20 text-red-300">
          <XCircle :size="30" />
        </span>
        <h2 class="mt-4 text-lg font-bold text-white">Check-In Failed</h2>
        <p class="mt-2 text-sm text-[#FCA5A5]">{{ message }}</p>

        <button
          type="button"
          class="mt-6 rounded-full bg-[#FFA500] px-6 py-2.5 text-sm font-bold text-black transition hover:bg-[#FFB52E]"
          @click="checkAgain"
        >
          Try Camera Again
        </button>
      </div>

      <!-- Loading -->
      <div v-else-if="state === 'loading'" class="mt-8 rounded-2xl border border-white/10 bg-[#14171C] p-8 text-center">
        <Loader2 :size="28" class="mx-auto animate-spin text-[#FFA500]" />
        <p class="mt-4 text-sm text-[#9CA3AF]">Checking you in...</p>
      </div>

      <!-- Idle / manual entry -->
      <div v-else class="mt-8 space-y-4 rounded-2xl border border-white/10 bg-[#14171C] p-6">
        <p class="text-center text-xs text-[#9CA3AF]">
          Or tap your ticket from the My Tickets page, or scan using your camera below.
        </p>

        <div class="rounded-xl border border-white/10 bg-[#1D2229] p-3">
          <QRCodeScanner :key="scanKey" @scan="onScanned" />
        </div>

        <div class="flex items-center gap-2">
          <span class="h-px flex-1 bg-white/10"></span>
          <span class="text-[10px] uppercase tracking-wider text-[#9CA3AF]">or</span>
          <span class="h-px flex-1 bg-white/10"></span>
        </div>

        <label class="mb-1 block text-xs font-semibold text-white/80">Ticket Code</label>
        <input
          v-model="manualCode"
          type="text"
          placeholder="Paste ticket code..."
          @keyup.enter="submitManual"
          class="w-full rounded-xl border border-white/10 bg-[#1D2229] px-3.5 py-2.5 font-mono text-sm text-white outline-none placeholder:text-white/25 focus:border-[#FFA500]/50"
        />
        <button
          type="button"
          :disabled="!manualCode.trim()"
          class="mt-3 flex w-full items-center justify-center gap-2 rounded-full bg-[#FFA500] px-6 py-2.5 text-sm font-bold text-black transition hover:bg-[#FFB52E] disabled:opacity-50"
          @click="submitManual"
        >
          <Ticket :size="15" />
          Complete Check-In
        </button>
      </div>
    </div>
  </div>
</template>