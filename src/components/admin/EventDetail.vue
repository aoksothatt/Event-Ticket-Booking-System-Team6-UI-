<script setup>
import { computed } from "vue";
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
  Building2,
} from "lucide-vue-next";

const props = defineProps({
  id: { type: String, default: "1" },
});

const router = useRouter();

const mockEvents = {
  "1": {
    title: "Neon Nights Music Festival",
    slug: "neon-nights-music-festival-2024",
    category: "Music & Concerts",
    organizer: "Wavelength Live",
    start_date: "2024-11-14",
    end_date: "2024-11-15",
    time: "07:00 PM - 02:00 AM",
    venue: "Riverside Amphitheater, Austin TX",
    sold: "4,102",
    capacity: "5,000",
    revenue: "$205,100",
    status: "published",
    description: "An electrifying electronic dance music festival featuring world-renowned DJs, immersive visual projections, and multiple themed stages.",
    tiers: [
      { name: "Early Bird Special", price: "$45.00", sold: 1000, total: 1000, status: "Sold Out" },
      { name: "General Admission", price: "$85.00", sold: 2602, total: 3000, status: "Active" },
      { name: "VIP Experience & Backstage", price: "$250.00", sold: 500, total: 1000, status: "Active" },
    ],
  },
  "2": {
    title: "Symphony in the Park 2024",
    slug: "symphony-in-the-park-2024",
    category: "Music & Concerts",
    organizer: "Civic Symphony Society",
    start_date: "2024-12-02",
    end_date: "2024-12-02",
    time: "06:30 PM - 09:30 PM",
    venue: "Central Park Meadow, New York NY",
    sold: "1,850",
    capacity: "2,000",
    revenue: "$92,500",
    status: "published",
    description: "An open-air classical music concert featuring Beethoven and Mozart symphonies under the starry night sky.",
    tiers: [
      { name: "Open Lawn Seating", price: "$35.00", sold: 1200, total: 1200, status: "Sold Out" },
      { name: "Standard Reserved Chair", price: "$85.00", sold: 650, total: 800, status: "Active" },
    ],
  },
  "3": {
    title: "Global Tech Summit 2024",
    slug: "global-tech-summit-2024",
    category: "Technology & Conferences",
    organizer: "Summit Conferences Co.",
    start_date: "2024-12-10",
    end_date: "2024-12-12",
    time: "09:00 AM - 05:00 PM",
    venue: "Grand Convention Center, San Francisco CA",
    sold: "1,500",
    capacity: "1,500",
    revenue: "$402,000",
    status: "published",
    description: "The premier global conference on AI, developer tooling, and cloud architectures.",
    tiers: [
      { name: "Standard Developer Pass", price: "$299.00", sold: 1000, total: 1000, status: "Sold Out" },
      { name: "All Access VIP Delegate", price: "$1,200.00", sold: 500, total: 500, status: "Sold Out" },
    ],
  },
};

const currentEvent = computed(() => {
  return (
    mockEvents[props.id] || {
      title: props.id === "new" ? "New Event Draft" : `Event #${props.id}`,
      slug: `event-${props.id}`,
      category: "General",
      organizer: "Platform Organizer",
      start_date: "TBD",
      end_date: "TBD",
      time: "TBD",
      venue: "TBD Venue Location",
      sold: "0",
      capacity: "1,000",
      revenue: "$0.00",
      status: props.id === "new" ? "draft" : "published",
      description: "Custom event details, description, and ticket tiers configuration.",
      tiers: [
        { name: "General Admission", price: "$50.00", sold: 0, total: 1000, status: "Active" },
      ],
    }
  );
});

const statusStyle = {
  published: "bg-emerald-50 text-emerald-700 border-emerald-200",
  draft: "bg-sky-50 text-sky-700 border-sky-200",
  cancelled: "bg-rose-50 text-rose-700 border-rose-200",
};
</script>

<template>
  <main class="min-h-screen flex-1 bg-slate-50 px-8 py-8 text-slate-800">
    <!-- Back button -->
    <button
      type="button"
      @click="router.push('/admin/events')"
      class="mb-6 flex items-center gap-2 text-sm font-semibold text-slate-500 transition-colors hover:text-slate-900"
    >
      <ArrowLeft :size="16" />
      Back to Events
    </button>

    <!-- Header info -->
    <div class="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <div class="flex items-center gap-3">
          <h1 class="text-3xl font-extrabold tracking-tight text-slate-900">{{ currentEvent.title }}</h1>
          <span class="rounded-md bg-sky-50 px-2.5 py-0.5 text-xs font-semibold text-sky-700 border border-sky-200">
            {{ currentEvent.category }}
          </span>
        </div>
        <p class="mt-1 text-sm text-slate-500">Organized by {{ currentEvent.organizer }} • Slug: /events/{{ currentEvent.slug }}</p>
      </div>

      <div class="flex items-center gap-3">
        <span class="h-fit rounded-full border px-3.5 py-1 text-xs font-semibold capitalize" :class="statusStyle[currentEvent.status] || 'bg-slate-100 text-slate-700'">
          {{ currentEvent.status }}
        </span>
      </div>
    </div>

    <!-- Stat metrics cards -->
    <div class="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-4">
      <div class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div class="mb-3 flex items-center gap-2 text-slate-500">
          <Calendar :size="16" class="text-amber-600" />
          <p class="text-xs font-semibold uppercase tracking-wider">Dates & Time</p>
        </div>
        <p class="text-base font-bold text-slate-900">{{ currentEvent.start_date }}</p>
        <p class="text-xs text-slate-400 mt-1">{{ currentEvent.time }}</p>
      </div>

      <div class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div class="mb-3 flex items-center gap-2 text-slate-500">
          <MapPin :size="16" class="text-amber-600" />
          <p class="text-xs font-semibold uppercase tracking-wider">Venue Location</p>
        </div>
        <p class="text-base font-bold text-slate-900">{{ currentEvent.venue }}</p>
      </div>

      <div class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div class="mb-3 flex items-center gap-2 text-slate-500">
          <Ticket :size="16" class="text-amber-600" />
          <p class="text-xs font-semibold uppercase tracking-wider">Tickets Sold</p>
        </div>
        <p class="text-base font-bold text-slate-900">{{ currentEvent.sold }} / {{ currentEvent.capacity }}</p>
      </div>

      <div class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div class="mb-3 flex items-center gap-2 text-slate-500">
          <DollarSign :size="16" class="text-amber-600" />
          <p class="text-xs font-semibold uppercase tracking-wider">Total Gross Revenue</p>
        </div>
        <p class="text-xl font-bold text-amber-600 font-mono">{{ currentEvent.revenue }}</p>
      </div>
    </div>

    <!-- Description & Details -->
    <div class="mb-8 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 class="text-base font-bold text-slate-900 mb-2">About this Event</h2>
      <p class="text-sm text-slate-600 leading-relaxed">{{ currentEvent.description }}</p>
    </div>

    <!-- Ticket tiers -->
    <div class="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div class="border-b border-slate-200 px-6 py-4">
        <h2 class="text-base font-bold text-slate-900">Configured Ticket Tiers & Capacity</h2>
      </div>

      <table class="w-full text-left text-sm">
        <thead class="bg-slate-50/70 border-b border-slate-200">
          <tr class="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            <th class="px-6 py-3">Tier Name</th>
            <th class="px-6 py-3">Price</th>
            <th class="px-6 py-3">Sold / Total</th>
            <th class="px-6 py-3 text-right">Tier Status</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100">
          <tr
            v-for="tier in currentEvent.tiers"
            :key="tier.name"
            class="transition-colors hover:bg-slate-50/80"
          >
            <td class="px-6 py-4 font-semibold text-slate-900">{{ tier.name }}</td>
            <td class="px-6 py-4 text-slate-800 font-mono font-bold">{{ tier.price }}</td>
            <td class="px-6 py-4 text-slate-600">{{ tier.sold }} / {{ tier.total }}</td>
            <td class="px-6 py-4 text-right">
              <span
                class="rounded-full px-2.5 py-0.5 text-[11px] font-semibold border capitalize"
                :class="tier.status === 'Sold Out' ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'"
              >
                {{ tier.status }}
              </span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </main>
</template>