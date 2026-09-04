<script setup>
import { computed, onMounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import {
  Calendar,
  Clock,
  MapPin,
  Ticket,
  Heart,
  Tag,
  ChevronLeft,
  Users,
} from "lucide-vue-next";
import { getEvent } from "../api/eventApi.js";
import { coverImage, formatDate, formatTime, formatPrice, minPrice } from "../utils/event.js";

const route = useRoute();
const router = useRouter();

const event = ref(null);
const loading = ref(true);
const error = ref("");

const image = computed(() => (event.value ? coverImage(event.value) : ""));
const price = computed(() => (event.value ? minPrice(event.value) : null));
const category = computed(() => event.value?.category?.name || "");
const venue = computed(() => event.value?.venue || null);

async function load(id) {
  loading.value = true;
  error.value = "";
  try {
    event.value = await getEvent(id);
  } catch (e) {
    error.value = e.message || "Could not load this event.";
    event.value = null;
  } finally {
    loading.value = false;
  }
}

function book() {
  if (event.value) router.push(`/events/${event.value.id}/booking`);
}

onMounted(() => load(route.params.id));
watch(() => route.params.id, (id) => load(id));
</script>

<template>
  <div class="px-4 pb-20 pt-24 sm:px-6 lg:px-8">
    <div class="mx-auto w-full max-w-6xl">
      <button
        type="button"
        class="mb-5 inline-flex items-center gap-1.5 text-sm text-[#9CA3AF] transition hover:text-white"
        @click="router.back()"
      >
        <ChevronLeft :size="16" />
        Back
      </button>

      <!-- Loading -->
      <div v-if="loading" class="animate-pulse space-y-6">
        <div class="aspect-[16/9] w-full rounded-3xl bg-[#14171C]"></div>
        <div class="h-9 w-2/3 rounded bg-[#14171C]"></div>
        <div class="h-4 w-1/2 rounded bg-[#14171C]"></div>
      </div>

      <!-- Error -->
      <div
        v-else-if="error"
        class="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-8 text-center text-red-300"
      >
        {{ error }}
      </div>

      <template v-else-if="event">
        <!-- Cover -->
        <div class="relative overflow-hidden rounded-3xl shadow-2xl shadow-black/50">
          <img
            v-if="image"
            :src="image"
            :alt="event.title"
            class="aspect-[16/8] w-full object-cover"
          />
          <div v-else class="flex aspect-[16/8] w-full items-center justify-center bg-[#14171C]">
            <span class="text-sm text-white/30">No image available</span>
          </div>
          <div class="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent"></div>

          <div class="absolute bottom-0 left-0 right-0 flex flex-wrap items-end justify-between gap-4 p-6 sm:p-8">
            <div>
              <div class="mb-2 flex items-center gap-2">
                <span v-if="category" class="rounded-full bg-[#FFA500] px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-black">
                  {{ category }}
                </span>
                <span v-if="event.status === 'cancelled'" class="rounded-full bg-red-500 px-3 py-1 text-[11px] font-bold uppercase text-white">
                  Cancelled
                </span>
              </div>
              <h1 class="max-w-2xl text-2xl font-extrabold tracking-tight text-white sm:text-4xl">
                {{ event.title }}
              </h1>
            </div>

            <div v-if="price !== null" class="text-right">
              <p class="text-xs text-white/70">Starting from</p>
              <p class="text-2xl font-extrabold text-[#FFA500] sm:text-3xl">{{ formatPrice(price) }}</p>
            </div>
          </div>
        </div>

        <!-- Meta + booking panel -->
        <div class="mt-8 grid gap-8 lg:grid-cols-[1fr_320px]">
          <!-- Left: description & details -->
          <div class="space-y-6">
            <div>
              <h2 class="mb-2 text-lg font-bold text-white">About this event</h2>
              <p class="text-sm leading-relaxed text-white/70">
                {{ event.description || "No description provided yet." }}
              </p>
            </div>

            <div class="grid gap-3 sm:grid-cols-2">
              <div class="rounded-2xl bg-[#14171C] p-4">
                <div class="flex items-center gap-2 text-[#FFA500]">
                  <Calendar :size="16" />
                  <span class="text-xs font-semibold uppercase tracking-wider text-white/50">Date</span>
                </div>
                <p class="mt-2 text-sm font-semibold text-white">{{ formatDate(event.start_date) }}</p>
              </div>
              <div class="rounded-2xl bg-[#14171C] p-4">
                <div class="flex items-center gap-2 text-[#FFA500]">
                  <Clock :size="16" />
                  <span class="text-xs font-semibold uppercase tracking-wider text-white/50">Time</span>
                </div>
                <p class="mt-2 text-sm font-semibold text-white">{{ formatTime(event.start_time) }}</p>
              </div>
              <div v-if="venue" class="rounded-2xl bg-[#14171C] p-4 sm:col-span-2">
                <div class="flex items-center gap-2 text-[#FFA500]">
                  <MapPin :size="16" />
                  <span class="text-xs font-semibold uppercase tracking-wider text-white/50">Venue</span>
                </div>
                <p class="mt-2 text-sm font-semibold text-white">{{ venue.name }}</p>
                <p v-if="venue.address || venue.city" class="mt-1 text-xs text-[#9CA3AF]">
                  {{ [venue.address, venue.city, venue.province].filter(Boolean).join(", ") }}
                </p>
              </div>
            </div>

            <!-- Ticket types -->
            <div v-if="(event.ticketTypes || event.ticket_types || []).length" class="rounded-2xl bg-[#14171C] p-5">
              <h3 class="mb-3 text-base font-bold text-white">Ticket Options</h3>
              <div class="space-y-2">
                <div
                  v-for="ticket in (event.ticketTypes || event.ticket_types || [])"
                  :key="ticket.id"
                  class="flex items-center justify-between rounded-xl bg-[#1D2229] px-4 py-3"
                >
                  <div>
                    <p class="text-sm font-semibold text-white">{{ ticket.name }}</p>
                    <p v-if="ticket.quantity !== undefined" class="flex items-center gap-1 text-xs text-[#9CA3AF]">
                      <Users :size="12" />
                      {{ Math.max(0, Number(ticket.quantity || 0) - Number(ticket.sold_quantity || 0)) }} left
                    </p>
                  </div>
                  <p class="text-sm font-bold text-[#FFA500]">{{ formatPrice(ticket.price) }}</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Right: booking CTA -->
          <aside class="h-fit rounded-2xl border border-white/10 bg-[#14171C] p-5 lg:sticky lg:top-24">
            <p class="mb-1 text-xs text-[#9CA3AF]">Availability</p>
            <p v-if="price !== null" class="flex items-center gap-2 text-2xl font-extrabold text-white">
              <Tag :size="20" class="text-[#FFA500]" />
              {{ formatPrice(price) }}
            </p>
            <p v-else class="text-2xl font-extrabold text-white">Free</p>

            <button
              type="button"
              :disabled="event.status === 'cancelled'"
              class="mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-[#FFA500] px-6 py-3 text-sm font-bold text-black shadow-lg shadow-[#FFA500]/20 transition hover:bg-[#FFB52E] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
              @click="book"
            >
              <Ticket :size="17" />
              Book Tickets
            </button>

            <button
              type="button"
              class="mt-3 flex w-full items-center justify-center gap-2 rounded-full border border-white/15 bg-white/5 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              <Heart :size="16" />
              Save Event
            </button>

            <div class="mt-5 border-t border-white/5 pt-4 text-xs text-[#9CA3AF]">
              <p>Secure checkout</p>
              <p class="mt-1">Get instant confirmation by email.</p>
            </div>
          </aside>
        </div>
      </template>
    </div>
  </div>
</template>
