<script setup>
import { ref, computed, onMounted } from "vue";
import { useI18n } from "vue-i18n";
import { useRouter, useRoute } from "vue-router";
import { adminApi } from "@/api/admin.js";
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
  Plus,
  Trash2,
  X,
  Loader2,
} from "lucide-vue-next";

const { t } = useI18n();
const router = useRouter();
const route = useRoute();
const id = route.params.id;

const event = ref(null);
const loading = ref(true);
const error = ref(null);

function formatCurrency(val) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(val || 0);
}

function formatNumber(val) {
  return new Intl.NumberFormat("en-US").format(val || 0);
}

function formatDate(d) {
  if (!d) return t("tbd");
  return new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

function formatTimeRange(start, end) {
  if (!start && !end) return t("tbd");
  const fmt = (t) => {
    if (!t) return "";
    const [h, m] = t.split(":").map(Number);
    const ampm = h >= 12 ? "PM" : "AM";
    const h12 = h % 12 || 12;
    return `${String(h12).padStart(2, "0")}:${String(m).padStart(2, "0")} ${ampm}`;
  };
  return `${fmt(start)} - ${fmt(end)}`;
}

function getTierStatus(ticketType) {
  if (ticketType.sold_quantity >= ticketType.quantity) return t("soldOut");
  return ticketType.status === "inactive" ? t("inactive") : t("active");
}

async function loadEvent() {
  try {
    loading.value = true;
    error.value = null;
    const res = await adminApi.getEvent(id);
    event.value = res?.data ?? res;
  } catch (e) {
    error.value = e.response?.data?.message || e.message || t("failedToLoadEvent");
  } finally {
    loading.value = false;
  }
}

onMounted(loadEvent);

const currentEvent = computed(() => {
  const e = event.value;
  if (!e) return null;

  const ticketTypes = e.ticketTypes || [];
  const sold = ticketTypes.reduce((sum, t) => sum + (t.sold_quantity || 0), 0);
  const capacity = ticketTypes.reduce((sum, t) => sum + (t.quantity || 0), 0);
  const revenue = ticketTypes.reduce((sum, t) => sum + (t.sold_quantity || 0) * (t.price || 0), 0);

  return {
    title: e.title || t("untitledEvent"),
    slug: e.slug || "",
    category: e.category?.name || t("na"),
    organizer: e.organizer?.company_name || e.organizer?.user?.name || t("na"),
    start_date: formatDate(e.start_date),
    end_date: formatDate(e.end_date),
    time: formatTimeRange(e.start_time, e.end_time),
    venue: `${e.venue?.name || t("na")}${e.venue?.city ? ", " + e.venue.city : ""}`,
    sold: formatNumber(sold),
    capacity: formatNumber(capacity),
    revenue: formatCurrency(revenue),
    status: e.status || "draft",
    description: e.description || t("noDescriptionProvided"),
    tiers: ticketTypes.map((t) => ({
      id: t.id,
      name: t.name,
      price: formatCurrency(t.price),
      sold: t.sold_quantity || 0,
      total: t.quantity || 0,
      status: getTierStatus(t),
    })),
  };
});

const statusStyle = {
  published: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-400 dark:border-emerald-500/30",
  draft: "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-500/15 dark:text-sky-400 dark:border-sky-500/30",
  cancelled: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/15 dark:text-rose-400 dark:border-rose-500/30",
};

const statusDisplayMap = { published: t("published"), draft: t("draft"), cancelled: t("cancelled") };

// ── Ticket management state ──────────────────────────────────────────────
const ticketModalOpen = ref(false);
const editingTicket = ref(null);
const ticketForm = ref({ name: "", price: "", quantity: "", status: "active" });
const ticketSaving = ref(false);
const ticketError = ref("");
const ticketDeletingId = ref(null);

function openAddTicketModal() {
  editingTicket.value = null;
  ticketForm.value = { name: "", price: "", quantity: "", status: "active" };
  ticketError.value = "";
  ticketModalOpen.value = true;
}

function openEditTicketModal(tier) {
  const raw = (event.value?.ticketTypes || []).find((t) => t.id === tier.id);
  editingTicket.value = raw || null;
  ticketForm.value = {
    name: raw?.name || "",
    price: raw?.price ?? "",
    quantity: raw?.quantity ?? "",
    status: raw?.status || "active",
  };
  ticketError.value = "";
  ticketModalOpen.value = true;
}

async function saveTicket() {
  ticketError.value = "";
  if (!ticketForm.value.name.trim() || ticketForm.value.price === "" || ticketForm.value.quantity === "") {
    ticketError.value = t("namePriceQuantityRequired");
    return;
  }

  const payload = {
    event_id: Number(id),
    name: ticketForm.value.name.trim(),
    price: ticketForm.value.price,
    quantity: ticketForm.value.quantity,
    status: ticketForm.value.status,
  };

  ticketSaving.value = true;
  try {
    if (editingTicket.value) {
      await adminApi.updateTicketType(editingTicket.value.id, payload);
    } else {
      await adminApi.createTicketType(payload);
    }
    ticketModalOpen.value = false;
    await loadEvent();
  } catch (e) {
    ticketError.value = e.response?.data?.message || e.message || t("failedToSaveTicketType");
  } finally {
    ticketSaving.value = false;
  }
}

async function deleteTicket(tier) {
  if (!confirm(t("deleteTicketConfirm", { name: tier.name }))) return;
  ticketDeletingId.value = tier.id;
  try {
    await adminApi.deleteTicketType(tier.id);
    await loadEvent();
  } catch (e) {
    alert(e.response?.data?.message || e.message || t("failedToDeleteTicketType"));
  } finally {
    ticketDeletingId.value = null;
  }
}
</script>

<template>
  <main class="min-h-screen flex-1 bg-slate-50 px-8 py-8 text-slate-800 dark:bg-slate-900 dark:text-white">
    <!-- Loading state -->
    <div v-if="loading" class="flex items-center justify-center py-20">
      <Clock :size="24" class="animate-spin text-slate-400 dark:text-slate-500" />
      <span class="ml-3 text-sm font-medium text-slate-500 dark:text-slate-400">{{ t('loading') }}</span>
    </div>

    <!-- Error state -->
    <div v-else-if="error" class="rounded-xl border border-rose-200 bg-rose-50 p-6 text-center dark:border-red-500/30 dark:bg-red-500/10">
      <p class="text-sm font-semibold text-rose-700 dark:text-rose-400">{{ error }}</p>
      <button
        type="button"
        @click="router.push('/admin/events')"
        class="mt-4 rounded-lg bg-rose-600 px-4 py-2 text-xs font-semibold text-white hover:bg-rose-700 transition-colors"
      >
        {{ t('backToEvents') }}
      </button>
    </div>

    <!-- Event content -->
    <template v-else-if="currentEvent">
      <!-- Back button -->
      <button
        type="button"
        @click="router.push('/admin/events')"
        class="mb-6 flex items-center gap-2 text-sm font-semibold text-slate-500 transition-colors hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
      >
        <ArrowLeft :size="16" />
        {{ t('backToEvents') }}
      </button>

      <!-- Header info -->
      <div class="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div class="flex items-center gap-3">
            <h1 class="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">{{ currentEvent.title }}</h1>
            <span class="rounded-md bg-sky-50 px-2.5 py-0.5 text-xs font-semibold text-sky-700 border border-sky-200 dark:bg-sky-500/15 dark:text-sky-400 dark:border-sky-500/30">
              {{ currentEvent.category }}
            </span>
          </div>
          <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">{{ t('organisedBy') }} {{ currentEvent.organizer }} • {{ t('slug') }}: /events/{{ currentEvent.slug }}</p>
        </div>

        <div class="flex items-center gap-3">
          <span class="h-fit rounded-full border px-3.5 py-1 text-xs font-semibold capitalize" :class="statusStyle[currentEvent.status] || 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300'">
            {{ statusDisplayMap[currentEvent.status] || currentEvent.status }}
          </span>
        </div>
      </div>

      <!-- Stat metrics cards -->
      <div class="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-4">
        <div class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <div class="mb-3 flex items-center gap-2 text-slate-500 dark:text-slate-400">
            <Calendar :size="16" class="text-amber-600 dark:text-amber-400" />
            <p class="text-xs font-semibold uppercase tracking-wider">{{ t('datesAndTime') }}</p>
          </div>
          <p class="text-base font-bold text-slate-900 dark:text-white">{{ currentEvent.start_date }}</p>
          <p class="text-xs text-slate-400 mt-1 dark:text-slate-500">{{ currentEvent.time }}</p>
        </div>

        <div class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <div class="mb-3 flex items-center gap-2 text-slate-500 dark:text-slate-400">
            <MapPin :size="16" class="text-amber-600 dark:text-amber-400" />
            <p class="text-xs font-semibold uppercase tracking-wider">{{ t('venueLocation') }}</p>
          </div>
          <p class="text-base font-bold text-slate-900 dark:text-white">{{ currentEvent.venue }}</p>
        </div>

        <div class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <div class="mb-3 flex items-center gap-2 text-slate-500 dark:text-slate-400">
            <Ticket :size="16" class="text-amber-600 dark:text-amber-400" />
            <p class="text-xs font-semibold uppercase tracking-wider">{{ t('ticketsSold') }}</p>
          </div>
          <p class="text-base font-bold text-slate-900 dark:text-white">{{ currentEvent.sold }} / {{ currentEvent.capacity }}</p>
        </div>

        <div class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <div class="mb-3 flex items-center gap-2 text-slate-500 dark:text-slate-400">
            <DollarSign :size="16" class="text-amber-600 dark:text-amber-400" />
            <p class="text-xs font-semibold uppercase tracking-wider">{{ t('grossRevenue') }}</p>
          </div>
          <p class="text-xl font-bold text-amber-600 font-mono">{{ currentEvent.revenue }}</p>
        </div>
      </div>

      <!-- Description & Details -->
      <div class="mb-8 rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
        <h2 class="text-base font-bold text-slate-900 mb-2 dark:text-white">{{ t('aboutEvent') }}</h2>
        <p class="text-sm text-slate-600 leading-relaxed dark:text-slate-300">{{ currentEvent.description }}</p>
      </div>

      <!-- Ticket tiers -->
      <div class="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
        <div class="flex items-center justify-between border-b border-slate-200 px-6 py-4 dark:border-slate-700">
          <div>
            <h2 class="text-base font-bold text-slate-900 dark:text-white">{{ t('configTicketTiers') }}</h2>
            <p class="text-xs text-slate-500 dark:text-slate-400">{{ t('createTicketTiers') }}</p>
          </div>
          <button
            type="button"
            @click="openAddTicketModal"
            class="flex items-center gap-2 rounded-lg bg-amber-500 px-4 py-2 text-xs font-semibold text-slate-950 shadow-sm transition-all hover:bg-amber-600 hover:shadow"
          >
            <Plus :size="15" :stroke-width="2.5" />
            {{ t('addTicket') }}
          </button>
        </div>

        <table class="w-full text-left text-sm">
          <thead class="bg-slate-50/70 border-b border-slate-200 dark:bg-slate-700/50 dark:border-slate-700">
            <tr class="text-[11px] font-bold text-slate-500 uppercase tracking-wider dark:text-slate-400">
              <th class="px-6 py-3">{{ t('tierName') }}</th>
              <th class="px-6 py-3">{{ t('price') }}</th>
              <th class="px-6 py-3">{{ t('soldTotal') }}</th>
              <th class="px-6 py-3">{{ t('tierStatus') }}</th>
              <th class="px-6 py-3 text-right">{{ t('actions') }}</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 dark:divide-slate-700">
            <tr
              v-for="tier in currentEvent.tiers"
              :key="tier.id"
              class="transition-colors hover:bg-slate-50/80 dark:hover:bg-slate-700/50"
            >
              <td class="px-6 py-4 font-semibold text-slate-900 dark:text-white">{{ tier.name }}</td>
              <td class="px-6 py-4 text-slate-800 font-mono font-bold dark:text-white">{{ tier.price }}</td>
              <td class="px-6 py-4 text-slate-600 dark:text-slate-300">{{ tier.sold }} / {{ tier.total }}</td>
              <td class="px-6 py-4">
                <span
                  class="rounded-full px-2.5 py-0.5 text-[11px] font-semibold border capitalize"
                  :class="tier.status === t('soldOut') ? 'bg-rose-50 text-rose-700 border-rose-200' : tier.status === t('inactive') ? 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:border-slate-600' : 'bg-emerald-50 text-emerald-700 border-emerald-200'"
                >
                  {{ tier.status }}
                </span>
              </td>
              <td class="px-6 py-4 text-right">
                <div class="flex items-center justify-end gap-1.5">
                  <button
                    type="button"
                    @click="openEditTicketModal(tier)"
                    class="rounded-lg border border-slate-200 bg-slate-50 p-1.5 text-slate-600 hover:border-amber-500 hover:text-amber-700 hover:bg-amber-50 dark:border-slate-700 dark:bg-slate-700 dark:text-slate-400 dark:hover:bg-amber-500/10"
                    :title="t('editTicketType')"
                  >
                    <Edit :size="14" />
                  </button>
                  <button
                    type="button"
                    :disabled="ticketDeletingId === tier.id"
                    @click="deleteTicket(tier)"
                    class="rounded-lg border border-rose-200 bg-rose-50 p-1.5 text-rose-600 hover:bg-rose-100 disabled:opacity-50 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-400 dark:hover:bg-red-500/20"
                    :title="t('delete')"
                  >
                    <Loader2 v-if="ticketDeletingId === tier.id" :size="14" class="animate-spin" />
                    <Trash2 v-else :size="14" />
                  </button>
                </div>
              </td>
            </tr>
            <tr v-if="currentEvent.tiers.length === 0">
              <td colspan="5" class="px-6 py-10 text-center">
                <p class="text-sm font-semibold text-slate-500 dark:text-slate-400">{{ t('noTicketTiers') }}</p>
                <p class="mt-1 text-xs text-slate-400 dark:text-slate-500">{{ t('addFirstTicket') }}</p>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </template>
  </main>

  <!-- Add / Edit Ticket Modal -->
  <div
    v-if="ticketModalOpen"
    class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm"
  >
    <div class="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-700 dark:bg-slate-800">
      <div class="mb-5 flex items-center justify-between border-b border-slate-200 pb-4 dark:border-slate-700">
        <h3 class="text-lg font-bold text-slate-900 dark:text-white">
          {{ editingTicket ? t('editTicketType') : t('addTicket') }}
        </h3>
        <button @click="ticketModalOpen = false" class="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:text-slate-500 dark:hover:bg-slate-700 dark:hover:text-white">
          <X :size="18" />
        </button>
      </div>

      <form @submit.prevent="saveTicket" class="space-y-4">
        <div>
          <label class="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">{{ t('ticketName') }}</label>
          <input
            v-model="ticketForm.name"
            type="text"
            required
            :placeholder="t('ticketNamePlaceholder')"
            class="w-full rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2 text-sm text-slate-900 outline-none focus:bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 dark:border-slate-700 dark:bg-slate-700 dark:text-white dark:focus:bg-slate-800"
          />
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">{{ t('priceUSD') }}</label>
            <input
              v-model="ticketForm.price"
              type="number"
              step="0.01"
              min="0"
              required
              placeholder="0.00"
              class="w-full rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2 text-sm text-slate-900 outline-none focus:bg-white focus:border-amber-500 dark:border-slate-700 dark:bg-slate-700 dark:text-white dark:focus:bg-slate-800"
            />
          </div>
          <div>
            <label class="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">{{ t('quantity') }} *</label>
            <input
              v-model="ticketForm.quantity"
              type="number"
              min="1"
              required
              :placeholder="t('quantityPlaceholder')"
              class="w-full rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2 text-sm text-slate-900 outline-none focus:bg-white focus:border-amber-500 dark:border-slate-700 dark:bg-slate-700 dark:text-white dark:focus:bg-slate-800"
            />
          </div>
        </div>

        <div>
          <label class="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">{{ t('status') }}</label>
          <select
            v-model="ticketForm.status"
            class="w-full rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2 text-sm text-slate-900 outline-none focus:bg-white focus:border-amber-500 capitalize dark:border-slate-700 dark:bg-slate-700 dark:text-white dark:focus:bg-slate-800"
          >
            <option value="active">{{ t('active') }}</option>
            <option value="inactive">{{ t('inactive') }}</option>
            <option value="sold_out">{{ t('soldOut') }}</option>
          </select>
        </div>

        <div v-if="ticketError" class="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-400">
          {{ ticketError }}
        </div>

        <div class="mt-6 flex justify-end gap-3 pt-2">
          <button
            type="button"
            @click="ticketModalOpen = false"
            class="rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-700"
          >
            {{ t('cancel') }}
          </button>
          <button
            type="submit"
            :disabled="ticketSaving"
            class="flex items-center gap-2 rounded-lg bg-amber-500 px-5 py-2 text-xs font-semibold text-slate-950 shadow-sm transition-all hover:bg-amber-600 disabled:opacity-60"
          >
            <Loader2 v-if="ticketSaving" :size="14" class="animate-spin" />
            {{ editingTicket ? t('saveChanges') : t('addTicket') }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>
