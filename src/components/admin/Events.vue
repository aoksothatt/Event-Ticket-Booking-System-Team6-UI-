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
  Eye,
  Edit,
  Trash2,
  X,
  Layers,
  Building2,
} from "lucide-vue-next";

const router = useRouter();

const stats = [
  {
    label: "Total Events",
    value: "342",
    change: "+22 this week",
    trend: "up",
    icon: Calendar,
    color: "bg-blue-50 text-blue-600",
  },
  {
    label: "Published / Active",
    value: "289",
    change: "84.5% of all events",
    trend: "up",
    icon: Flame,
    color: "bg-amber-50 text-amber-600",
  },
  {
    label: "Total Tickets Sold",
    value: "48,210",
    change: "+15.2% vs last month",
    trend: "up",
    icon: Ticket,
    color: "bg-emerald-50 text-emerald-600",
  },
];

const searchQuery = ref("");
const selectedCategory = ref("All");
const selectedStatus = ref("All");

const events = ref([
  {
    id: 1,
    title: "Neon Nights Music Festival",
    slug: "neon-nights-music-festival-2024",
    organizer: "Wavelength Live",
    organizer_id: 1,
    category: "Music & Concerts",
    category_id: 1,
    venue: "Riverside Amphitheater",
    venue_id: 1,
    start_date: "2024-11-14",
    end_date: "2024-11-15",
    start_time: "19:00",
    end_time: "02:00",
    status: "published",
    description: "An electrifying electronic dance music festival featuring world-renowned DJs.",
  },
  {
    id: 2,
    title: "Symphony in the Park 2024",
    slug: "symphony-in-the-park-2024",
    organizer: "Civic Symphony Society",
    organizer_id: 2,
    category: "Music & Concerts",
    category_id: 1,
    venue: "Central Park Meadow",
    venue_id: 2,
    start_date: "2024-12-02",
    end_date: "2024-12-02",
    start_time: "18:30",
    end_time: "21:30",
    status: "published",
  },
  {
    id: 3,
    title: "Global Tech Summit 2024",
    slug: "global-tech-summit-2024",
    organizer: "Summit Conferences Co.",
    organizer_id: 3,
    category: "Technology & Conferences",
    category_id: 2,
    venue: "Grand Convention Center",
    venue_id: 3,
    start_date: "2024-12-10",
    end_date: "2024-12-12",
    start_time: "09:00",
    end_time: "17:00",
    status: "published",
  },
  {
    id: 4,
    title: "Underground Comedy Night",
    slug: "underground-comedy-night",
    organizer: "Laugh Track Presents",
    organizer_id: 4,
    category: "Comedy & Stand-up",
    category_id: 3,
    venue: "The Cellar Lounge",
    venue_id: 4,
    start_date: "2024-11-20",
    end_date: "2024-11-20",
    start_time: "20:00",
    end_time: "22:30",
    status: "published",
  },
  {
    id: 5,
    title: "Modern Art Gala & Auction",
    slug: "modern-art-gala-auction",
    organizer: "Gallery Nine",
    organizer_id: 5,
    category: "Art & Exhibitions",
    category_id: 4,
    venue: "Metropolitan Hall",
    venue_id: 5,
    start_date: "2025-01-15",
    end_date: "2025-01-15",
    start_time: "19:00",
    end_time: "23:00",
    status: "draft",
  },
  {
    id: 6,
    title: "Street Eats Food Expo",
    slug: "street-eats-food-expo",
    organizer: "Street Eats Collective",
    organizer_id: 6,
    category: "Food & Drinks Expo",
    category_id: 5,
    venue: "Koh Pich Theater Hall",
    venue_id: 7,
    start_date: "2024-10-10",
    end_date: "2024-10-12",
    start_time: "11:00",
    end_time: "20:00",
    status: "cancelled",
  },
]);

const categories = ["All", "Music & Concerts", "Technology & Conferences", "Comedy & Stand-up", "Art & Exhibitions", "Food & Drinks Expo"];
const statuses = ["All", "published", "draft", "cancelled"];

const statusStyle = {
  published: "bg-emerald-50 text-emerald-700 border-emerald-200",
  draft: "bg-sky-50 text-sky-700 border-sky-200",
  cancelled: "bg-rose-50 text-rose-700 border-rose-200",
};

const filteredEvents = computed(() => {
  return events.value.filter((event) => {
    const matchesSearch =
      event.title.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
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

// Create/Edit Modal State
const isModalOpen = ref(false);
const editingEvent = ref(null);
const form = ref({
  title: "",
  slug: "",
  organizer: "Wavelength Live",
  category: "Music & Concerts",
  venue: "Riverside Amphitheater",
  start_date: "",
  end_date: "",
  start_time: "19:00",
  end_time: "23:00",
  capacity: 1000,
  price_range: "$50",
  status: "published",
  description: "",
});

function openCreateModal() {
  editingEvent.value = null;
  form.value = {
    title: "",
    slug: "",
    organizer: "Wavelength Live",
    category: "Music & Concerts",
    venue: "Riverside Amphitheater",
    start_date: new Date().toISOString().split("T")[0],
    end_date: new Date().toISOString().split("T")[0],
    start_time: "19:00",
    end_time: "23:00",
    capacity: 1000,
    price_range: "$50",
    status: "published",
    description: "",
  };
  isModalOpen.value = true;
}

function openEditModal(ev) {
  editingEvent.value = ev;
  form.value = { ...ev };
  isModalOpen.value = true;
}

function saveEvent() {
  if (!form.value.title.trim()) return;

  if (editingEvent.value) {
    const idx = events.value.findIndex((e) => e.id === editingEvent.value.id);
    if (idx !== -1) {
      events.value[idx] = {
        ...events.value[idx],
        ...form.value,
      };
    }
  } else {
    const newId = Math.max(...events.value.map((e) => e.id), 0) + 1;
    events.value.unshift({
      id: newId,
      ...form.value,
      sold: 0,
      slug: form.value.title.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
    });
  }
  isModalOpen.value = false;
}

function deleteEvent(id) {
  if (confirm("Are you sure you want to delete this event?")) {
    events.value = events.value.filter((e) => e.id !== id);
  }
}
</script>

<template>
  <main class="min-h-screen flex-1 bg-slate-50 px-8 py-8 text-slate-800">
    <!-- Header -->
    <div class="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <div class="flex items-center gap-2.5">
          <h1 class="text-3xl font-extrabold tracking-tight text-slate-900">Events Management</h1>
          <span class="rounded-md bg-amber-100 border border-amber-200 px-2.5 py-0.5 text-xs text-amber-800 font-mono font-medium">
            manage_events
          </span>
        </div>
        <p class="mt-1 text-sm text-slate-500">Configure platform events, manage dates, schedules, venues, and ticket pricing.</p>
      </div>
      <div class="flex items-center gap-3">
        <button
          type="button"
          @click="openCreateModal"
          class="flex items-center gap-2 rounded-lg bg-amber-500 px-4 py-2.5 text-sm font-semibold text-slate-950 shadow-sm transition-all hover:bg-amber-600 hover:shadow"
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
        class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
      >
        <div class="mb-4 flex items-start justify-between">
          <p class="text-xs font-semibold text-slate-500 uppercase tracking-wider">{{ stat.label }}</p>
          <span class="flex h-8 w-8 items-center justify-center rounded-lg shadow-sm" :class="stat.color">
            <component :is="stat.icon" :size="16" />
          </span>
        </div>
        <p class="text-2xl font-bold text-slate-900">{{ stat.value }}</p>
        <p class="mt-2 flex items-center gap-1 text-xs font-medium text-emerald-600">
          <ArrowUpRight :size="14" />
          {{ stat.change }}
        </p>
      </div>
    </div>

    <!-- Filter & Search Bar -->
    <div class="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div class="relative min-w-[260px] flex-1">
        <Search :size="16" class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Search by title, venue, organizer..."
          class="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm text-slate-800 placeholder:text-slate-400 outline-none shadow-sm transition-all focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
        />
      </div>

      <div class="flex flex-wrap items-center gap-3">
        <!-- Category Filter -->
        <div class="flex items-center gap-2">
          <label class="text-xs font-semibold text-slate-500">Category:</label>
          <select
            v-model="selectedCategory"
            class="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 outline-none shadow-sm focus:border-amber-500"
          >
            <option v-for="cat in categories" :key="cat" :value="cat">{{ cat }}</option>
          </select>
        </div>

        <!-- Status Filter -->
        <div class="flex items-center gap-2">
          <label class="text-xs font-semibold text-slate-500">Status:</label>
          <select
            v-model="selectedStatus"
            class="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 outline-none shadow-sm focus:border-amber-500 capitalize"
          >
            <option v-for="st in statuses" :key="st" :value="st">{{ st }}</option>
          </select>
        </div>
      </div>
    </div>

    <!-- Events Table -->
    <div class="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div class="flex items-center justify-between border-b border-slate-200 px-6 py-4">
        <h2 class="text-base font-bold text-slate-900">Events ({{ filteredEvents.length }})</h2>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full text-left text-sm">
          <thead class="bg-slate-50/70 border-b border-slate-200">
            <tr class="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              <th class="px-6 py-3">Event Title & Organizer</th>
              <th class="px-6 py-3">Dates & Timing</th>
              <th class="px-6 py-3">Venue Location</th>
              <th class="px-6 py-3">Status</th>
              <th class="px-6 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr
              v-for="event in filteredEvents"
              :key="event.id"
              class="transition-colors hover:bg-slate-50/80"
            >
              <td class="px-6 py-4">
                <div>
                  <p class="font-semibold text-slate-900">{{ event.title }}</p>
                  <div class="mt-1 flex items-center gap-2 text-xs text-slate-500">
                    <span class="rounded bg-slate-100 border border-slate-200 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700">{{ event.category }}</span>
                    <span>by {{ event.organizer }}</span>
                  </div>
                </div>
              </td>
              <td class="px-6 py-4 text-slate-700">
                <div class="text-sm font-semibold text-slate-900">{{ event.start_date }}</div>
                <div class="text-xs text-slate-400">{{ event.start_time }} - {{ event.end_time }}</div>
              </td>
              <td class="px-6 py-4 text-slate-700">
                <div class="flex items-center gap-1.5 text-xs font-medium">
                  <MapPin :size="13" class="text-amber-600" />
                  {{ event.venue }}
                </div>
              </td>
              <td class="px-6 py-4">
                <span
                  class="rounded-full border px-2.5 py-0.5 text-[11px] font-semibold capitalize"
                  :class="statusStyle[event.status]"
                >
                  {{ event.status }}
                </span>
              </td>
              <td class="px-6 py-4 text-right">
                <div class="flex items-center justify-end gap-1.5">
                  <button
                    type="button"
                    @click="viewEvent(event.id)"
                    class="rounded-lg border border-slate-200 bg-slate-50 p-1.5 text-slate-600 hover:border-amber-500 hover:text-amber-700 hover:bg-amber-50"
                    title="View Details"
                  >
                    <Eye :size="14" />
                  </button>
                  <button
                    type="button"
                    @click="openEditModal(event)"
                    class="rounded-lg border border-slate-200 bg-slate-50 p-1.5 text-slate-600 hover:border-amber-500 hover:text-amber-700 hover:bg-amber-50"
                    title="Edit Event"
                  >
                    <Edit :size="14" />
                  </button>
                  <button
                    type="button"
                    @click="deleteEvent(event.id)"
                    class="rounded-lg border border-rose-200 bg-rose-50 p-1.5 text-rose-600 hover:bg-rose-100"
                    title="Delete Event"
                  >
                    <Trash2 :size="14" />
                  </button>
                </div>
              </td>
            </tr>
            <tr v-if="filteredEvents.length === 0">
              <td colspan="5" class="px-6 py-8 text-center text-sm text-slate-400">
                No events found matching your search.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Create / Edit Event Modal -->
    <div
      v-if="isModalOpen"
      class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm"
    >
      <div class="w-full max-w-xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div class="mb-5 flex items-center justify-between border-b border-slate-200 pb-4">
          <h3 class="text-lg font-bold text-slate-900">
            {{ editingEvent ? "Edit Event" : "Create New Event" }}
          </h3>
          <button @click="isModalOpen = false" class="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700">
            <X :size="18" />
          </button>
        </div>

        <form @submit.prevent="saveEvent" class="space-y-4">
          <div>
            <label class="mb-1 block text-xs font-semibold text-slate-700">Event Title *</label>
            <input
              v-model="form.title"
              type="text"
              required
              placeholder="e.g. Neon Nights Music Festival"
              class="w-full rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2 text-sm text-slate-900 outline-none focus:bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
            />
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="mb-1 block text-xs font-semibold text-slate-700">Category *</label>
              <select
                v-model="form.category"
                class="w-full rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2 text-sm text-slate-900 outline-none focus:bg-white focus:border-amber-500"
              >
                <option v-for="c in categories.filter(x => x !== 'All')" :key="c" :value="c">{{ c }}</option>
              </select>
            </div>
            <div>
              <label class="mb-1 block text-xs font-semibold text-slate-700">Organizer</label>
              <input
                v-model="form.organizer"
                type="text"
                class="w-full rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2 text-sm text-slate-900 outline-none focus:bg-white focus:border-amber-500"
              />
            </div>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="mb-1 block text-xs font-semibold text-slate-700">Venue Location *</label>
              <input
                v-model="form.venue"
                type="text"
                required
                class="w-full rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2 text-sm text-slate-900 outline-none focus:bg-white focus:border-amber-500"
              />
            </div>
            <div>
              <label class="mb-1 block text-xs font-semibold text-slate-700">Capacity</label>
              <input
                v-model="form.capacity"
                type="number"
                min="1"
                class="w-full rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2 text-sm text-slate-900 outline-none focus:bg-white focus:border-amber-500"
              />
            </div>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="mb-1 block text-xs font-semibold text-slate-700">Start Date *</label>
              <input
                v-model="form.start_date"
                type="date"
                required
                class="w-full rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2 text-sm text-slate-900 outline-none focus:bg-white focus:border-amber-500"
              />
            </div>
            <div>
              <label class="mb-1 block text-xs font-semibold text-slate-700">End Date *</label>
              <input
                v-model="form.end_date"
                type="date"
                required
                class="w-full rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2 text-sm text-slate-900 outline-none focus:bg-white focus:border-amber-500"
              />
            </div>
          </div>

          <div class="grid grid-cols-3 gap-3">
            <div>
              <label class="mb-1 block text-xs font-semibold text-slate-700">Start Time</label>
              <input
                v-model="form.start_time"
                type="time"
                class="w-full rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2 text-sm text-slate-900 outline-none focus:bg-white focus:border-amber-500"
              />
            </div>
            <div>
              <label class="mb-1 block text-xs font-semibold text-slate-700">End Time</label>
              <input
                v-model="form.end_time"
                type="time"
                class="w-full rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2 text-sm text-slate-900 outline-none focus:bg-white focus:border-amber-500"
              />
            </div>
            <div>
              <label class="mb-1 block text-xs font-semibold text-slate-700">Status</label>
              <select
                v-model="form.status"
                class="w-full rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2 text-sm text-slate-900 outline-none focus:bg-white focus:border-amber-500 capitalize"
              >
                <option value="published">Published</option>
                <option value="draft">Draft</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          <div>
            <label class="mb-1 block text-xs font-semibold text-slate-700">Description</label>
            <textarea
              v-model="form.description"
              rows="3"
              class="w-full rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2 text-sm text-slate-900 outline-none focus:bg-white focus:border-amber-500"
            />
          </div>

          <div class="mt-6 flex justify-end gap-3 pt-2">
            <button
              type="button"
              @click="isModalOpen = false"
              class="rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              class="rounded-lg bg-amber-500 px-5 py-2 text-xs font-semibold text-slate-950 shadow-sm transition-all hover:bg-amber-600"
            >
              {{ editingEvent ? "Save Changes" : "Create Event" }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </main>
</template>
