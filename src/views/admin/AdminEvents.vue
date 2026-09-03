<script setup>
import { ref, computed } from "vue";
import { useRouter } from "vue-router";
import {
  Search,
  Plus,
  Calendar,
  Ticket,
  MapPin,
  CalendarCheck,
  Flame,
  ArrowUpRight,
  ExternalLink,
  Eye,
} from "lucide-vue-next";

const router = useRouter();

const stats = [
  {
    label: "Total Events",
    value: "342",
    change: "+22 this week",
    trend: "up",
    icon: Calendar,
  },
  {
    label: "Active / On Sale",
    value: "289",
    change: "84.5% of all events",
    trend: "up",
    icon: Flame,
  },
  {
    label: "Total Tickets Sold",
    value: "48,210",
    change: "+15.2% from last month",
    trend: "up",
    icon: Ticket,
  },
];

const searchQuery = ref("");
const selectedCategory = ref("All");
const selectedStatus = ref("All");

const events = ref([
  {
    id: "1",
    name: "Neon Nights Festival",
    organizer: "Wavelength Live",
    category: "Music",
    date: "Nov 14, 2024",
    time: "07:00 PM",
    venue: "Riverside Amphitheater",
    sold: 4102,
    capacity: 5000,
    price: "$45 - $250",
    status: "On Sale",
  },
  {
    id: "2",
    name: "Symphony in the Park",
    organizer: "Civic Symphony Society",
    category: "Music",
    date: "Dec 02, 2024",
    time: "06:30 PM",
    venue: "Central Park Meadow",
    sold: 1850,
    capacity: 2000,
    price: "$35 - $85",
    status: "On Sale",
  },
  {
    id: "3",
    name: "Tech Summit 2024",
    organizer: "Summit Conferences Co.",
    category: "Technology",
    date: "Dec 10, 2024",
    time: "09:00 AM",
    venue: "Grand Convention Center",
    sold: 1500,
    capacity: 1500,
    price: "$299 - $1,200",
    status: "Sold Out",
  },
  {
    id: "4",
    name: "Underground Comedy Club",
    organizer: "Laugh Track Presents",
    category: "Comedy",
    date: "Nov 20, 2024",
    time: "08:00 PM",
    venue: "The Cellar Lounge",
    sold: 220,
    capacity: 250,
    price: "$25 - $45",
    status: "On Sale",
  },
  {
    id: "5",
    name: "Modern Art Gala",
    organizer: "Gallery Nine",
    category: "Art",
    date: "Jan 15, 2025",
    time: "07:00 PM",
    venue: "Metropolitan Hall",
    sold: 120,
    capacity: 600,
    price: "$150",
    status: "Upcoming",
  },
  {
    id: "6",
    name: "Street Eats Food Expo",
    organizer: "Street Eats Collective",
    category: "Food",
    date: "Oct 10, 2024",
    time: "11:00 AM",
    venue: "Waterfront Plaza",
    sold: 3400,
    capacity: 3400,
    price: "$15 - $30",
    status: "Past",
  },
]);

const categories = ["All", "Music", "Technology", "Comedy", "Art", "Food"];
const statuses = ["All", "On Sale", "Upcoming", "Sold Out", "Past"];

const statusStyle = {
  "On Sale": "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  Upcoming: "bg-sky-500/10 text-sky-400 border-sky-500/20",
  "Sold Out": "bg-rose-500/10 text-rose-400 border-rose-500/20",
  Past: "bg-white/10 text-white/50 border-white/10",
};

const filteredEvents = computed(() => {
  return events.value.filter((event) => {
    const matchesSearch =
      event.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      event.venue.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      event.organizer.toLowerCase().includes(searchQuery.value.toLowerCase());

    const matchesCategory =
      selectedCategory.value === "All" || event.category === selectedCategory.value;

    const matchesStatus =
      selectedStatus.value === "All" || event.status === selectedStatus.value;

    return matchesSearch && matchesCategory && matchesStatus;
  });
});

function viewEvent(id) {
  router.push(`/admin/events/${id}`);
}
</script>

<template>
  <main class="min-h-screen flex-1 bg-[#0B0B0C] px-8 py-8 text-white">
    <!-- Header -->
    <div class="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h1 class="text-3xl font-bold tracking-tight">Events Management</h1>
        <p class="mt-1 text-sm text-white/50">Manage, monitor, and configure all platform events.</p>
      </div>
      <div class="flex items-center gap-3">
        <button
          type="button"
          @click="viewEvent('new')"
          class="flex items-center gap-2 rounded-lg bg-amber-500 px-4 py-2.5 text-sm font-medium text-black transition-opacity hover:opacity-90 shadow-md shadow-amber-500/10"
        >
          <Plus :size="16" :stroke-width="2.5" />
          Create Event
        </button>
      </div>
    </div>

    <!-- Stat cards -->
    <div class="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
      <div
        v-for="stat in stats"
        :key="stat.label"
        class="rounded-xl border border-white/10 bg-[#141416] p-5"
      >
        <div class="mb-6 flex items-start justify-between">
          <p class="text-xs font-medium text-white/50">{{ stat.label }}</p>
          <span class="flex h-8 w-8 items-center justify-center rounded-md bg-white/5 text-amber-400">
            <component :is="stat.icon" :size="16" :stroke-width="2" />
          </span>
        </div>
        <p class="text-2xl font-bold">{{ stat.value }}</p>
        <p class="mt-2 flex items-center gap-1 text-xs text-emerald-400">
          <ArrowUpRight :size="14" :stroke-width="2.5" />
          {{ stat.change }}
        </p>
      </div>
    </div>

    <!-- Filter & Search Bar -->
    <div class="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-white/10 bg-[#141416] p-4">
      <div class="relative min-w-[260px] flex-1">
        <Search :size="16" class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Search by event, venue, organizer..."
          class="w-full rounded-lg border border-white/10 bg-[#111113] py-2 pl-9 pr-3 text-sm text-white placeholder:text-white/40 outline-none focus:border-amber-500/60"
        />
      </div>

      <div class="flex flex-wrap items-center gap-3">
        <!-- Category Filter -->
        <div class="flex items-center gap-2">
          <label class="text-xs font-medium text-white/50">Category:</label>
          <select
            v-model="selectedCategory"
            class="rounded-lg border border-white/10 bg-[#111113] px-3 py-2 text-xs text-white outline-none focus:border-amber-500/60"
          >
            <option v-for="cat in categories" :key="cat" :value="cat">{{ cat }}</option>
          </select>
        </div>

        <!-- Status Filter -->
        <div class="flex items-center gap-2">
          <label class="text-xs font-medium text-white/50">Status:</label>
          <select
            v-model="selectedStatus"
            class="rounded-lg border border-white/10 bg-[#111113] px-3 py-2 text-xs text-white outline-none focus:border-amber-500/60"
          >
            <option v-for="st in statuses" :key="st" :value="st">{{ st }}</option>
          </select>
        </div>
      </div>
    </div>

    <!-- Events Table -->
    <div class="overflow-hidden rounded-xl border border-white/10 bg-[#141416]">
      <div class="flex items-center justify-between border-b border-white/10 px-5 py-4">
        <h2 class="text-base font-semibold">Events ({{ filteredEvents.length }})</h2>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full text-left text-sm">
          <thead>
            <tr class="text-xs text-white/40">
              <th class="px-5 py-3 font-medium">Event Name</th>
              <th class="px-5 py-3 font-medium">Date & Time</th>
              <th class="px-5 py-3 font-medium">Venue</th>
              <th class="px-5 py-3 font-medium">Tickets Sold</th>
              <th class="px-5 py-3 font-medium">Price Range</th>
              <th class="px-5 py-3 font-medium">Status</th>
              <th class="px-5 py-3 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="event in filteredEvents"
              :key="event.id"
              class="border-t border-white/5 transition-colors hover:bg-white/[0.03]"
            >
              <td class="px-5 py-4">
                <div>
                  <p class="font-medium text-white">{{ event.name }}</p>
                  <div class="mt-1 flex items-center gap-2 text-xs text-white/50">
                    <span class="rounded bg-white/5 px-1.5 py-0.5 text-[10px] text-amber-400">{{ event.category }}</span>
                    <span>by {{ event.organizer }}</span>
                  </div>
                </div>
              </td>
              <td class="px-5 py-4 text-white/70">
                <div class="text-sm">{{ event.date }}</div>
                <div class="text-xs text-white/40">{{ event.time }}</div>
              </td>
              <td class="px-5 py-4 text-white/70">
                <div class="flex items-center gap-1.5 text-sm">
                  <MapPin :size="14" class="text-white/40" />
                  {{ event.venue }}
                </div>
              </td>
              <td class="px-5 py-4">
                <div class="w-36">
                  <div class="flex justify-between text-xs text-white/60 mb-1">
                    <span>{{ event.sold.toLocaleString() }} / {{ event.capacity.toLocaleString() }}</span>
                    <span>{{ Math.round((event.sold / event.capacity) * 100) }}%</span>
                  </div>
                  <div class="h-1.5 w-full rounded-full bg-white/10 overflow-hidden">
                    <div
                      class="h-full rounded-full bg-amber-500"
                      :style="{ width: `${Math.min(100, Math.round((event.sold / event.capacity) * 100))}%` }"
                    />
                  </div>
                </div>
              </td>
              <td class="px-5 py-4 text-white/70 font-medium">
                {{ event.price }}
              </td>
              <td class="px-5 py-4">
                <span
                  class="rounded-full border px-2.5 py-1 text-xs font-medium"
                  :class="statusStyle[event.status]"
                >
                  {{ event.status }}
                </span>
              </td>
              <td class="px-5 py-4 text-right">
                <button
                  type="button"
                  @click="viewEvent(event.id)"
                  class="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-white hover:bg-white/10 hover:border-amber-500/40"
                >
                  <Eye :size="14" />
                  View
                </button>
              </td>
            </tr>
            <tr v-if="filteredEvents.length === 0">
              <td colspan="7" class="px-5 py-8 text-center text-sm text-white/40">
                No events found matching your criteria.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </main>
</template>
