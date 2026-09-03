<script setup>
import { ref, computed } from "vue";
import {
  Search,
  Ticket,
  Plus,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowUpRight,
  Edit,
  Trash2,
  X,
  DollarSign,
  Layers,
} from "lucide-vue-next";

const stats = [
  { label: "Total Ticket Types", value: "180", change: "+12 new tiers", icon: Ticket, color: "bg-purple-50 text-purple-600" },
  { label: "Total Tickets Sold", value: "48,210", change: "78% platform inventory", icon: CheckCircle2, color: "bg-emerald-50 text-emerald-600" },
  { label: "Sold Out Tiers", value: "32", change: "High demand events", icon: Clock, color: "bg-amber-50 text-amber-600" },
];

const searchQuery = ref("");
const selectedStatus = ref("All");

const ticketTypes = ref([
  {
    id: 1,
    name: "VIP Experience & Backstage",
    event_id: 1,
    event: "Neon Nights Music Festival",
    description: "Includes backstage access, free drinks voucher, and private lounge.",
    price: 250.00,
    quantity: 1000,
    sold_quantity: 500,
    status: "active",
  },
  {
    id: 2,
    name: "General Admission",
    event_id: 1,
    event: "Neon Nights Music Festival",
    description: "Standard entrance to all festival stages and food stalls.",
    price: 85.00,
    quantity: 3000,
    sold_quantity: 2602,
    status: "active",
  },
  {
    id: 3,
    name: "Early Bird Special",
    event_id: 1,
    event: "Neon Nights Music Festival",
    description: "Discounted admission for early supporters.",
    price: 45.00,
    quantity: 1000,
    sold_quantity: 1000,
    status: "sold_out",
  },
  {
    id: 4,
    name: "Standard Reserved Chair",
    event_id: 2,
    event: "Symphony in the Park 2024",
    description: "Numbered seating close to the orchestra pavilion.",
    price: 85.00,
    quantity: 800,
    sold_quantity: 650,
    status: "active",
  },
  {
    id: 5,
    name: "Open Lawn Seating",
    event_id: 2,
    event: "Symphony in the Park 2024",
    description: "Bring your own picnic blanket on the meadow grass.",
    price: 35.00,
    quantity: 1200,
    sold_quantity: 1200,
    status: "sold_out",
  },
  {
    id: 6,
    name: "All Access VIP Delegate",
    event_id: 3,
    event: "Global Tech Summit 2024",
    description: "Full summit pass, investor dinner, and workshop access.",
    price: 1200.00,
    quantity: 500,
    sold_quantity: 500,
    status: "sold_out",
  },
  {
    id: 7,
    name: "Standard Developer Pass",
    event_id: 3,
    event: "Global Tech Summit 2024",
    description: "Keynotes, breakout sessions, and expo floor access.",
    price: 299.00,
    quantity: 1000,
    sold_quantity: 1000,
    status: "sold_out",
  },
]);

const statuses = ["All", "active", "sold_out", "inactive"];

const statusStyle = {
  active: "bg-emerald-50 text-emerald-700 border-emerald-200",
  sold_out: "bg-rose-50 text-rose-700 border-rose-200",
  inactive: "bg-slate-100 text-slate-500 border-slate-200",
};

const filteredTicketTypes = computed(() => {
  return ticketTypes.value.filter((t) => {
    const matchesSearch =
      t.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      t.event.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      t.description.toLowerCase().includes(searchQuery.value.toLowerCase());

    const matchesStatus =
      selectedStatus.value === "All" || t.status === selectedStatus.value;

    return matchesSearch && matchesStatus;
  });
});

// Create/Edit Modal State
const isModalOpen = ref(false);
const editingTicket = ref(null);
const form = ref({
  name: "",
  event: "Neon Nights Music Festival",
  description: "",
  price: 50.00,
  quantity: 500,
  sold_quantity: 0,
  status: "active",
});

function openCreateModal() {
  editingTicket.value = null;
  form.value = {
    name: "",
    event: "Neon Nights Music Festival",
    description: "",
    price: 50.00,
    quantity: 500,
    sold_quantity: 0,
    status: "active",
  };
  isModalOpen.value = true;
}

function openEditModal(ticket) {
  editingTicket.value = ticket;
  form.value = { ...ticket };
  isModalOpen.value = true;
}

function saveTicket() {
  if (!form.value.name.trim()) return;

  if (editingTicket.value) {
    const idx = ticketTypes.value.findIndex((t) => t.id === editingTicket.value.id);
    if (idx !== -1) {
      ticketTypes.value[idx] = {
        ...ticketTypes.value[idx],
        ...form.value,
        price: Number(form.value.price),
        quantity: Number(form.value.quantity),
      };
    }
  } else {
    const newId = Math.max(...ticketTypes.value.map((t) => t.id), 0) + 1;
    ticketTypes.value.unshift({
      id: newId,
      ...form.value,
      price: Number(form.value.price),
      quantity: Number(form.value.quantity),
      sold_quantity: 0,
    });
  }
  isModalOpen.value = false;
}

function deleteTicket(id) {
  if (confirm("Are you sure you want to delete this ticket type?")) {
    ticketTypes.value = ticketTypes.value.filter((t) => t.id !== id);
  }
}
</script>

<template>
  <main class="min-h-screen flex-1 bg-slate-50 px-8 py-8 text-slate-800">
    <!-- Header -->
    <div class="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <div class="flex items-center gap-2.5">
          <h1 class="text-3xl font-extrabold tracking-tight text-slate-900">Ticket Types Management</h1>
          <span class="rounded-md bg-purple-100 border border-purple-200 px-2.5 py-0.5 text-xs text-purple-800 font-mono font-medium">
            manage_ticket_types
          </span>
        </div>
        <p class="mt-1 text-sm text-slate-500">Manage ticket tiers, pricing, quantity quotas, and availability.</p>
      </div>
      <div class="flex items-center gap-3">
        <button
          type="button"
          @click="openCreateModal"
          class="flex items-center gap-2 rounded-lg bg-amber-500 px-4 py-2.5 text-sm font-semibold text-slate-950 shadow-sm transition-all hover:bg-amber-600 hover:shadow"
        >
          <Plus :size="16" :stroke-width="2.5" />
          Add Ticket Type
        </button>
      </div>
    </div>

    <!-- Stat cards -->
    <div class="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
      <div v-for="stat in stats" :key="stat.label" class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
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
          placeholder="Search ticket tiers by name, event, description..."
          class="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm text-slate-800 placeholder:text-slate-400 outline-none shadow-sm transition-all focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
        />
      </div>

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

    <!-- Tickets table -->
    <div class="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div class="flex items-center justify-between border-b border-slate-200 px-6 py-4">
        <h2 class="text-base font-bold text-slate-900">Configured Ticket Types ({{ filteredTicketTypes.length }})</h2>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full text-left text-sm">
          <thead class="bg-slate-50/70 border-b border-slate-200">
            <tr class="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              <th class="px-6 py-3">Ticket Tier Name</th>
              <th class="px-6 py-3">Associated Event</th>
              <th class="px-6 py-3">Unit Price</th>
              <th class="px-6 py-3">Sold / Total Quantity</th>
              <th class="px-6 py-3">Status</th>
              <th class="px-6 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr v-for="t in filteredTicketTypes" :key="t.id" class="transition-colors hover:bg-slate-50/80">
              <td class="px-6 py-4">
                <div class="flex items-center gap-2.5">
                  <div class="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-50 text-purple-600 border border-purple-100 shadow-sm">
                    <Ticket :size="16" />
                  </div>
                  <div>
                    <p class="font-semibold text-slate-900">{{ t.name }}</p>
                    <p class="text-xs text-slate-500 line-clamp-1 max-w-xs">{{ t.description }}</p>
                  </div>
                </div>
              </td>
              <td class="px-6 py-4 text-xs font-medium text-slate-700">
                {{ t.event }}
              </td>
              <td class="px-6 py-4 font-mono font-bold text-slate-900">
                ${{ t.price.toFixed(2) }}
              </td>
              <td class="px-6 py-4">
                <div class="w-36">
                  <div class="flex justify-between text-xs text-slate-600 mb-1">
                    <span>{{ t.sold_quantity.toLocaleString() }} / {{ t.quantity.toLocaleString() }}</span>
                    <span class="font-semibold">{{ Math.round((t.sold_quantity / t.quantity) * 100) }}%</span>
                  </div>
                  <div class="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden border border-slate-200">
                    <div
                      class="h-full rounded-full"
                      :class="t.sold_quantity >= t.quantity ? 'bg-rose-500' : 'bg-amber-500'"
                      :style="{ width: `${Math.min(100, Math.round((t.sold_quantity / t.quantity) * 100))}%` }"
                    />
                  </div>
                </div>
              </td>
              <td class="px-6 py-4">
                <span class="rounded-full px-2.5 py-0.5 text-[11px] font-semibold border capitalize" :class="statusStyle[t.status]">
                  {{ t.status.replace('_', ' ') }}
                </span>
              </td>
              <td class="px-6 py-4 text-right">
                <div class="flex items-center justify-end gap-1.5">
                  <button
                    type="button"
                    @click="openEditModal(t)"
                    class="rounded-lg border border-slate-200 bg-slate-50 p-1.5 text-slate-600 hover:border-amber-500 hover:text-amber-700 hover:bg-amber-50"
                  >
                    <Edit :size="14" />
                  </button>
                  <button
                    type="button"
                    @click="deleteTicket(t.id)"
                    class="rounded-lg border border-rose-200 bg-rose-50 p-1.5 text-rose-600 hover:bg-rose-100"
                  >
                    <Trash2 :size="14" />
                  </button>
                </div>
              </td>
            </tr>
            <tr v-if="filteredTicketTypes.length === 0">
              <td colspan="6" class="px-6 py-8 text-center text-sm text-slate-400">
                No ticket types found matching your search.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Create / Edit Ticket Modal -->
    <div
      v-if="isModalOpen"
      class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm"
    >
      <div class="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
        <div class="mb-5 flex items-center justify-between border-b border-slate-200 pb-4">
          <h3 class="text-lg font-bold text-slate-900">
            {{ editingTicket ? "Edit Ticket Tier" : "Add Ticket Type" }}
          </h3>
          <button @click="isModalOpen = false" class="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700">
            <X :size="18" />
          </button>
        </div>

        <form @submit.prevent="saveTicket" class="space-y-4">
          <div>
            <label class="mb-1 block text-xs font-semibold text-slate-700">Tier Name *</label>
            <input
              v-model="form.name"
              type="text"
              required
              placeholder="e.g. VIP Experience / Early Bird"
              class="w-full rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2 text-sm text-slate-900 outline-none focus:bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
            />
          </div>

          <div>
            <label class="mb-1 block text-xs font-semibold text-slate-700">Event</label>
            <input
              v-model="form.event"
              type="text"
              required
              class="w-full rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2 text-sm text-slate-900 outline-none focus:bg-white focus:border-amber-500"
            />
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="mb-1 block text-xs font-semibold text-slate-700">Price ($) *</label>
              <input
                v-model="form.price"
                type="number"
                step="0.01"
                min="0"
                required
                class="w-full rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2 text-sm text-slate-900 outline-none focus:bg-white focus:border-amber-500"
              />
            </div>
            <div>
              <label class="mb-1 block text-xs font-semibold text-slate-700">Quantity Available *</label>
              <input
                v-model="form.quantity"
                type="number"
                min="1"
                required
                class="w-full rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2 text-sm text-slate-900 outline-none focus:bg-white focus:border-amber-500"
              />
            </div>
          </div>

          <div>
            <label class="mb-1 block text-xs font-semibold text-slate-700">Status</label>
            <select
              v-model="form.status"
              class="w-full rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2 text-sm text-slate-900 outline-none focus:bg-white focus:border-amber-500 capitalize"
            >
              <option value="active">Active (On Sale)</option>
              <option value="sold_out">Sold Out</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          <div>
            <label class="mb-1 block text-xs font-semibold text-slate-700">Description & Perks</label>
            <textarea
              v-model="form.description"
              rows="2"
              placeholder="Perks included with this ticket..."
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
              {{ editingTicket ? "Save Changes" : "Create Ticket Tier" }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </main>
</template>