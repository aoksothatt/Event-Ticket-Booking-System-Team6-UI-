<script setup>
import { ref, computed } from "vue";
import { useRouter } from "vue-router";
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Ticket,
  DollarSign,
  Users,
  CheckCircle2,
  Clock,
  Edit,
  Tag,
} from "lucide-vue-next";

const props = defineProps({
  id: { type: String, default: "1" },
});

const router = useRouter();

const mockEvents = {
  "1": {
    name: "Neon Nights Festival",
    category: "Music",
    organizer: "Wavelength Live",
    date: "Nov 14, 2024",
    time: "07:00 PM - 02:00 AM",
    venue: "Riverside Amphitheater, Austin TX",
    sold: "4,102",
    capacity: "5,000",
    revenue: "$205,100",
    status: "On Sale",
    description: "An electrifying electronic dance music festival featuring world-renowned DJs, immersive visual projections, and multiple themed stages.",
    tiers: [
      { name: "Early Bird", price: "$45.00", sold: 1000, total: 1000, status: "Sold Out" },
      { name: "General Admission", price: "$85.00", sold: 2602, total: 3000, status: "Selling Fast" },
      { name: "VIP Experience", price: "$250.00", sold: 500, total: 1000, status: "Available" },
    ],
  },
  "2": {
    name: "Symphony in the Park",
    category: "Music",
    organizer: "Civic Symphony Society",
    date: "Dec 02, 2024",
    time: "06:30 PM - 09:30 PM",
    venue: "Central Park Meadow, New York NY",
    sold: "1,850",
    capacity: "2,000",
    revenue: "$92,500",
    status: "On Sale",
    description: "An open-air classical music concert featuring Beethoven and Mozart symphonies under the starry night sky.",
    tiers: [
      { name: "Lawn Seating", price: "$35.00", sold: 1200, total: 1200, status: "Sold Out" },
      { name: "Reserved Chair", price: "$85.00", sold: 650, total: 800, status: "Available" },
    ],
  },
  "3": {
    name: "Tech Summit 2024",
    category: "Technology",
    organizer: "Summit Conferences Co.",
    date: "Dec 10, 2024",
    time: "09:00 AM - 05:00 PM",
    venue: "Grand Convention Center, San Francisco CA",
    sold: "1,500",
    capacity: "1,500",
    revenue: "$402,000",
    status: "Sold Out",
    description: "The premier global conference on AI, developer tooling, and cloud architectures.",
    tiers: [
      { name: "Developer Pass", price: "$299.00", sold: 1000, total: 1000, status: "Sold Out" },
      { name: "All Access VIP", price: "$1,200.00", sold: 500, total: 500, status: "Sold Out" },
    ],
  },
};

const currentEvent = computed(() => {
  return (
    mockEvents[props.id] || {
      name: props.id === "new" ? "New Event Draft" : `Event #${props.id}`,
      category: "General",
      organizer: "Platform Organizer",
      date: "TBD",
      time: "TBD",
      venue: "TBD",
      sold: "0",
      capacity: "1,000",
      revenue: "$0.00",
      status: props.id === "new" ? "Draft" : "Upcoming",
      description: "Custom event details and ticket tiers configuration.",
      tiers: [
        { name: "General Admission", price: "$50.00", sold: 0, total: 1000, status: "Draft" },
      ],
    }
  );
});
</script>

<template>
  <main class="min-h-screen flex-1 bg-[#0B0B0C] px-8 py-8 text-white">
    <!-- Back button -->
    <button
      type="button"
      @click="router.push('/admin/events')"
      class="mb-6 flex items-center gap-2 text-sm text-white/50 transition-colors hover:text-white"
    >
      <ArrowLeft :size="16" />
      Back to Events
    </button>

    <!-- Header info -->
    <div class="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <div class="flex items-center gap-3">
          <h1 class="text-3xl font-bold tracking-tight">{{ currentEvent.name }}</h1>
          <span class="rounded bg-white/5 px-2 py-0.5 text-xs text-amber-400 border border-amber-500/20">
            {{ currentEvent.category }}
          </span>
        </div>
        <p class="mt-1 text-sm text-white/50">Organized by {{ currentEvent.organizer }} • ID: {{ id }}</p>
      </div>

      <div class="flex items-center gap-3">
        <span class="h-fit rounded-full bg-emerald-500/10 border border-emerald-500/20 px-3.5 py-1 text-xs font-medium text-emerald-400">
          {{ currentEvent.status }}
        </span>
      </div>
    </div>

    <!-- Stat metrics cards -->
    <div class="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-4">
      <div class="rounded-xl border border-white/10 bg-[#141416] p-5">
        <div class="mb-3 flex items-center gap-2 text-white/50">
          <Calendar :size="16" class="text-amber-400" />
          <p class="text-xs font-medium">Date & Time</p>
        </div>
        <p class="text-base font-semibold text-white">{{ currentEvent.date }}</p>
        <p class="text-xs text-white/40 mt-1">{{ currentEvent.time }}</p>
      </div>

      <div class="rounded-xl border border-white/10 bg-[#141416] p-5">
        <div class="mb-3 flex items-center gap-2 text-white/50">
          <MapPin :size="16" class="text-amber-400" />
          <p class="text-xs font-medium">Venue Location</p>
        </div>
        <p class="text-base font-semibold text-white">{{ currentEvent.venue }}</p>
      </div>

      <div class="rounded-xl border border-white/10 bg-[#141416] p-5">
        <div class="mb-3 flex items-center gap-2 text-white/50">
          <Ticket :size="16" class="text-amber-400" />
          <p class="text-xs font-medium">Tickets Sold</p>
        </div>
        <p class="text-base font-semibold text-white">{{ currentEvent.sold }} / {{ currentEvent.capacity }}</p>
      </div>

      <div class="rounded-xl border border-white/10 bg-[#141416] p-5">
        <div class="mb-3 flex items-center gap-2 text-white/50">
          <DollarSign :size="16" class="text-amber-400" />
          <p class="text-xs font-medium">Total Gross Revenue</p>
        </div>
        <p class="text-xl font-bold text-amber-400">{{ currentEvent.revenue }}</p>
      </div>
    </div>

    <!-- Description & Details -->
    <div class="mb-8 rounded-xl border border-white/10 bg-[#141416] p-6">
      <h2 class="text-base font-semibold mb-2">About this Event</h2>
      <p class="text-sm text-white/70 leading-relaxed">{{ currentEvent.description }}</p>
    </div>

    <!-- Ticket tiers -->
    <div class="overflow-hidden rounded-xl border border-white/10 bg-[#141416]">
      <div class="border-b border-white/10 px-6 py-4">
        <h2 class="text-base font-semibold">Ticket Tiers & Pricing</h2>
      </div>

      <table class="w-full text-left text-sm">
        <thead>
          <tr class="text-xs text-white/40">
            <th class="px-6 py-3 font-medium">Tier Name</th>
            <th class="px-6 py-3 font-medium">Price</th>
            <th class="px-6 py-3 font-medium">Sold / Total</th>
            <th class="px-6 py-3 text-right font-medium">Tier Status</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="tier in currentEvent.tiers"
            :key="tier.name"
            class="border-t border-white/5 hover:bg-white/[0.03]"
          >
            <td class="px-6 py-4 font-medium text-white">{{ tier.name }}</td>
            <td class="px-6 py-4 text-white/80">{{ tier.price }}</td>
            <td class="px-6 py-4 text-white/60">{{ tier.sold }} / {{ tier.total }}</td>
            <td class="px-6 py-4 text-right">
              <span class="rounded-full bg-white/10 px-2.5 py-1 text-xs font-medium text-white/80">
                {{ tier.status }}
              </span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </main>
</template>