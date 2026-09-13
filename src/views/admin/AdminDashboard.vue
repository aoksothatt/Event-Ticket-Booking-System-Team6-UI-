<script setup>
import { ref, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import { adminApi } from "@/api/admin.js";
import {
  Search,
  DollarSign,
  CalendarCheck,
  UserPlus,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  Layers,
  MapPin,
  Ticket,
  ShoppingBag,
  CreditCard,
  QrCode,
  Star,
  Building2,
  Users,
  Eye,
  CheckCircle2,
  Clock,
  AlertCircle,
  Store,
} from "lucide-vue-next";

const router = useRouter();
const { t } = useI18n();
const searchQuery = ref("");
const loading = ref(true);
const error = ref(null);

const dashboard = ref({
  total_users: 0,
  total_organizers: 0,
  total_events: 0,
  total_categories: 0,
  total_venues: 0,
  total_bookings: 0,
  total_revenue: "0.00",
  pending_bookings: 0,
  active_events: 0,
  active_users: 0,
  verified_organizers: 0,
  total_tickets_sold: 0,
});

const recentBookings = ref([]);

function formatCurrency(val) {
  const num = parseFloat(val);
  if (isNaN(num)) return "$0";
  if (num >= 1000000) return `$${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `$${(num / 1000).toFixed(1)}k`;
  return `$${num.toLocaleString()}`;
}

function formatNumber(val) {
  const num = Number(val);
  if (isNaN(num)) return "0";
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}k`;
  return num.toLocaleString();
}

function formatTime(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function userInitials(name) {
  if (!name) return "??";
  return name.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase();
}

const stats = computed(() => [
  {
    label: t("grossRevenue"),
    value: formatCurrency(dashboard.value.total_revenue),
    change: `${dashboard.value.total_bookings} ${t("allTimeBookings").toLowerCase()}`,
    icon: DollarSign,
    color: "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400",
  },
  {
    label: t("totalBookings"),
    value: formatNumber(dashboard.value.total_bookings),
    change: `${dashboard.value.pending_bookings} ${t("pending").toLowerCase()}`,
    icon: ShoppingBag,
    color: "bg-orange-50 text-orange-600 dark:bg-orange-500/10 dark:text-orange-400",
  },
  {
    label: t("totalEvents"),
    value: formatNumber(dashboard.value.active_events),
    change: `${dashboard.value.total_events} ${t("totalEvents").toLowerCase()}`,
    icon: Calendar,
    color: "bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400",
  },
  {
    label: t("ticketsSold"),
    value: formatNumber(dashboard.value.total_tickets_sold),
    change: t("moduleStats.issuedToCustomers"),
    icon: QrCode,
    color: "bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400",
  },
  {
    label: t("totalUsers"),
    value: formatNumber(dashboard.value.total_users),
    change: `${dashboard.value.active_users} ${t("moduleStats.active")}`,
    icon: Users,
    color: "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400",
  },
  {
    label: t("totalOrganizers"),
    value: `${dashboard.value.verified_organizers}`,
    change: `${dashboard.value.total_organizers} ${t("total").toLowerCase()}`,
    icon: Building2,
    color: "bg-purple-50 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400",
  },
]);

const managementModules = computed(() => [
  { name: t("moduleNames.events"), count: `${dashboard.value.active_events} ${t("moduleStats.active")}`, permission: "manage_events", to: "/admin/events", icon: Calendar, color: "text-amber-600 bg-amber-50 border-amber-200 dark:bg-amber-500/10 dark:border-amber-500/20" },
  { name: t("moduleNames.categories"), count: `${dashboard.value.total_categories} ${t("moduleStats.types")}`, permission: "manage_categories", to: "/admin/categories", icon: Layers, color: "text-sky-600 bg-sky-50 border-sky-200 dark:bg-sky-500/10 dark:border-sky-500/20" },
  { name: t("moduleNames.venues"), count: `${dashboard.value.total_venues} ${t("moduleStats.locations")}`, permission: "manage_venues", to: "/admin/venues", icon: MapPin, color: "text-emerald-600 bg-emerald-50 border-emerald-200 dark:bg-emerald-500/10 dark:border-emerald-500/20" },
  { name: t("moduleNames.ticketTypes"), count: `${dashboard.value.total_tickets_sold} ${t("moduleStats.sold")}`, permission: "manage_ticket_types", to: "/admin/tickets", icon: Ticket, color: "text-purple-600 bg-purple-50 border-purple-200 dark:bg-purple-500/10 dark:border-purple-500/20" },
  { name: t("moduleNames.bookings"), count: `${formatNumber(dashboard.value.total_bookings)} ${t("moduleStats.orders")}`, permission: "manage_bookings", to: "/admin/bookings", icon: ShoppingBag, color: "text-orange-600 bg-orange-50 border-orange-200 dark:bg-orange-500/10 dark:border-orange-500/20" },
  { name: t("moduleNames.payments"), count: `${formatCurrency(dashboard.value.total_revenue)} ${t("moduleStats.paid")}`, permission: "manage_payments", to: "/admin/payments", icon: CreditCard, color: "text-emerald-600 bg-emerald-50 border-emerald-200 dark:bg-emerald-500/10 dark:border-emerald-500/20" },
  { name: t("moduleNames.checkIns"), count: t("moduleStats.scanToCheckIn"), permission: "manage_checkins", to: "/admin/check-ins", icon: QrCode, color: "text-indigo-600 bg-indigo-50 border-indigo-200 dark:bg-indigo-500/10 dark:border-indigo-500/20" },
  { name: t("moduleNames.tickets"), count: t("moduleStats.issuedToCustomers"), permission: "manage_tickets", to: "/admin/customer-tickets", icon: Ticket, color: "text-purple-600 bg-purple-50 border-purple-200 dark:bg-purple-500/10 dark:border-purple-500/20" },
  { name: t("moduleNames.reviews"), count: t("moduleStats.viewAll"), permission: "manage_reviews", to: "/admin/reviews", icon: Star, color: "text-yellow-600 bg-yellow-50 border-yellow-200 dark:bg-yellow-500/10 dark:border-yellow-500/20" },
  { name: t("moduleNames.organizers"), count: `${dashboard.value.total_organizers} ${t("moduleStats.hosts")}`, permission: "manage_organizers", to: "/admin/organizers", icon: Building2, color: "text-rose-600 bg-rose-50 border-rose-200 dark:bg-rose-500/10 dark:border-rose-500/20" },
  { name: t("moduleNames.users"), count: `${formatNumber(dashboard.value.total_users)} ${t("moduleStats.members")}`, permission: "manage_users", to: "/admin/users", icon: Users, color: "text-teal-600 bg-teal-50 border-teal-200 dark:bg-teal-500/10 dark:border-teal-500/20" },
]);

const filteredBookings = computed(() => {
  if (!searchQuery.value) return recentBookings.value;
  const q = searchQuery.value.toLowerCase();
  return recentBookings.value.filter(
    (b) =>
      (b.booking_number || "").toLowerCase().includes(q) ||
      (b.user?.name || "").toLowerCase().includes(q) ||
      (b.user?.email || "").toLowerCase().includes(q) ||
      (b.event?.title || "").toLowerCase().includes(q)
  );
});

const statusBadge = {
  confirmed: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-400 dark:border-emerald-500/30",
  completed: "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-500/15 dark:text-sky-400 dark:border-sky-500/30",
  pending: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/15 dark:text-amber-400 dark:border-amber-500/30",
  cancelled: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/15 dark:text-rose-400 dark:border-rose-500/30",
};

const paymentBadge = {
  paid: "bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-400 dark:border-emerald-500/30",
  pending: "bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-500/15 dark:text-amber-400 dark:border-amber-500/30",
  failed: "bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-500/15 dark:text-rose-400 dark:border-rose-500/30",
  refunded: "bg-purple-50 text-purple-700 border border-purple-200 dark:bg-purple-500/15 dark:text-purple-400 dark:border-purple-500/30",
};

onMounted(async () => {
  loading.value = true;
  error.value = null;
  try {
    const [dashRes, bookingsRes] = await Promise.all([
      adminApi.getDashboard(),
      adminApi.getBookings(),
    ]);

    if (dashRes?.data) {
      dashboard.value = dashRes.data;
    }

    const bookingsList = Array.isArray(bookingsRes?.data) ? bookingsRes.data : [];
    recentBookings.value = bookingsList.slice(0, 10);
  } catch (e) {
    error.value = e.response?.data?.message || e.message || t("failed");
  } finally {
    loading.value = false;
  }
});
</script>

<template>
  <main class="min-h-screen flex-1 bg-slate-50 px-8 py-8 text-slate-800 dark:bg-slate-900 dark:text-white">
    <!-- Loading State -->
    <div v-if="loading" class="flex items-center justify-center py-32">
      <div class="text-center">
        <div class="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-amber-200 border-t-amber-600" />
        <p class="text-sm text-slate-500 dark:text-slate-400">{{ t("loadingData") }}</p>
      </div>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="flex items-center justify-center py-32">
      <div class="text-center">
        <div class="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-rose-100 dark:bg-red-500/10">
          <AlertCircle class="text-rose-600 dark:text-red-400" :size="24" />
        </div>
        <p class="text-sm font-semibold text-slate-900 dark:text-white">{{ t("failed") }}</p>
        <p class="mt-1 text-xs text-slate-500 dark:text-slate-400">{{ error }}</p>
        <button @click="$router.go(0)" class="mt-4 rounded-lg bg-amber-500 px-4 py-2 text-xs font-semibold text-slate-950 hover:bg-amber-600">{{ t("retry") }}</button>
      </div>
    </div>

    <!-- Main Content -->
    <template v-else>
      <!-- Header -->
      <div class="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div class="flex items-center gap-2.5">
            <h1 class="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">{{ t("adminDashboard") }}</h1>
            <span class="rounded-full bg-amber-100 border border-amber-200 px-3 py-0.5 text-xs font-semibold text-amber-800 dark:bg-amber-500/15 dark:border-amber-500/30 dark:text-amber-400">
              {{ t("platformMasterControl") }}
            </span>
          </div>
          <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {{ t("platformOverview") }}
          </p>
        </div>

        <div class="flex items-center gap-3">
          <div class="relative">
            <Search :size="16" class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
            <input
              v-model="searchQuery"
              type="text"
              :placeholder="t('searchPlaceholder')"
              class="w-72 rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm text-slate-800 placeholder:text-slate-400 outline-none shadow-sm transition-all focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder-slate-500"
            />
          </div>
          <button
            type="button"
            @click="router.push('/home')"
            class="flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition-all hover:border-amber-500 hover:text-amber-700 hover:bg-amber-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-amber-500/10"
          >
            <Store :size="15" />
            {{ t("viewStorefront") }}
          </button>
        </div>
      </div>

      <!-- Modules Quick Access Grid -->
      <div class="mb-8">
        <div class="mb-3 flex items-center justify-between">
          <h2 class="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">{{ t("managementHub") }}</h2>
          <span class="text-xs font-medium text-slate-400 dark:text-slate-500">{{ t("roleModules") }}</span>
        </div>
        <div class="grid grid-cols-2 gap-3 sm:grid-cols-5">
          <RouterLink
            v-for="mod in managementModules"
            :key="mod.name"
            :to="mod.to"
            class="group flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm transition-all hover:border-amber-400 hover:shadow-md hover:-translate-y-0.5 dark:border-slate-700 dark:bg-slate-800"
          >
            <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border" :class="mod.color">
              <component :is="mod.icon" :size="18" />
            </div>
            <div class="min-w-0 flex-1">
              <p class="truncate text-xs font-bold text-slate-900 group-hover:text-amber-600 dark:text-white">{{ mod.name }}</p>
              <p class="truncate text-[11px] font-medium text-slate-400 dark:text-slate-500">{{ mod.count }}</p>
            </div>
          </RouterLink>
        </div>
      </div>

      <!-- Platform Stats Cards -->
      <div class="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <div
          v-for="stat in stats"
          :key="stat.label"
          class="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-all hover:shadow-md dark:border-slate-700 dark:bg-slate-800"
        >
          <div class="mb-3 flex items-start justify-between">
            <span class="flex h-8 w-8 items-center justify-center rounded-lg shadow-sm" :class="stat.color">
              <component :is="stat.icon" :size="16" />
            </span>
            <span class="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded flex items-center gap-0.5 border border-emerald-100 dark:text-emerald-400 dark:bg-emerald-500/10 dark:border-emerald-500/20">
              <ArrowUpRight :size="11" />
              {{ t("active") }}
            </span>
          </div>
          <p class="text-xs font-medium text-slate-500 dark:text-slate-400">{{ stat.label }}</p>
          <p class="text-xl font-bold mt-1 text-slate-900 dark:text-white">{{ stat.value }}</p>
          <p class="mt-1 text-[11px] font-medium text-slate-400 dark:text-slate-500">{{ stat.change }}</p>
        </div>
      </div>

      <!-- Main Content Grid: Recent Bookings + Live Operations Activity -->
      <div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <!-- Recent Bookings (2 Cols) -->
        <div class="lg:col-span-2 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <div class="flex items-center justify-between border-b border-slate-200 px-6 py-4 dark:border-slate-700">
            <div>
              <h2 class="text-base font-bold text-slate-900 dark:text-white">{{ t("recentBookings") }}</h2>
              <p class="text-xs text-slate-500 dark:text-slate-400">{{ t("recentBookingsDesc") }}</p>
            </div>
            <RouterLink
              to="/admin/bookings"
              class="text-xs font-semibold text-amber-600 hover:text-amber-700 transition-colors"
            >
              {{ t("viewAllBookings") }}
            </RouterLink>
          </div>

          <div class="overflow-x-auto">
            <table class="w-full text-left text-sm">
              <thead class="bg-slate-50/70 border-b border-slate-200 dark:bg-slate-700/50 dark:border-slate-700">
                <tr class="text-[11px] font-bold text-slate-500 uppercase tracking-wider dark:text-slate-400">
                  <th class="px-6 py-3">{{ t("bookingNumberHeader") }}</th>
                  <th class="px-6 py-3">{{ t("customerHeader") }}</th>
                  <th class="px-6 py-3">{{ t("eventHeader") }}</th>
                  <th class="px-6 py-3">{{ t("paymentHeader") }}</th>
                  <th class="px-6 py-3 text-right">{{ t("amountHeader") }}</th>
                  <th class="px-6 py-3 text-right">{{ t("status") }}</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100 dark:divide-slate-700">
                <tr
                  v-for="b in filteredBookings"
                  :key="b.id"
                  class="transition-colors hover:bg-slate-50/80 dark:hover:bg-slate-700/50"
                >
                  <td class="px-6 py-3.5 font-mono text-xs text-amber-600 font-semibold">
                    {{ b.booking_number }}
                  </td>
                  <td class="px-6 py-3.5">
                    <div class="flex items-center gap-2.5">
                      <span class="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 font-bold text-[10px] text-slate-700 border border-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:border-slate-600">
                        {{ userInitials(b.user?.name) }}
                      </span>
                      <div>
                        <p class="text-xs font-semibold text-slate-900 dark:text-white">{{ b.user?.name || t("na") }}</p>
                        <p class="text-[11px] text-slate-400 dark:text-slate-500">{{ b.user?.email || '' }}</p>
                      </div>
                    </div>
                  </td>
                  <td class="px-6 py-3.5">
                    <p class="text-xs font-medium text-slate-800 max-w-[170px] truncate dark:text-white">{{ b.event?.title || t("na") }}</p>
                    <p class="text-[11px] text-slate-400 dark:text-slate-500">{{ formatTime(b.booking_date) }}</p>
                  </td>
                  <td class="px-6 py-3.5">
                    <span v-if="b.payments?.length" class="rounded-md px-2 py-0.5 text-[11px] font-semibold" :class="paymentBadge[b.payments[0].payment_status]">
                      {{ b.payments[0].payment_method || t("na") }}
                    </span>
                    <span v-else class="text-[11px] text-slate-400 dark:text-slate-500">{{ t("noPayment") }}</span>
                  </td>
                  <td class="px-6 py-3.5 text-right font-bold text-slate-900 text-xs dark:text-white">
                    ${{ Number(b.total_amount || 0).toFixed(2) }}
                  </td>
                  <td class="px-6 py-3.5 text-right">
                    <span class="rounded-full border px-2.5 py-0.5 text-[10px] font-semibold capitalize" :class="statusBadge[b.status] || 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:border-slate-600'">
                      {{ b.status }}
                    </span>
                  </td>
                </tr>
                <tr v-if="filteredBookings.length === 0">
                  <td colspan="6" class="px-6 py-8 text-center text-xs text-slate-400 dark:text-slate-500">
                    {{ t("noBookingsFound") }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Live Activity & Operations Feed (1 Col) -->
        <div class="space-y-4">
          <!-- Quick Summary Box -->
          <div class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800">
            <h3 class="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 dark:text-slate-400">{{ t("platformSummary") }}</h3>
            <div class="space-y-2.5">
              <div class="flex items-center justify-between text-xs">
                <span class="text-slate-500 dark:text-slate-400">{{ t("totalRevenue") }}</span>
                <span class="font-bold text-slate-900 dark:text-white">{{ formatCurrency(dashboard.total_revenue) }}</span>
              </div>
              <div class="flex items-center justify-between text-xs">
                <span class="text-slate-500 dark:text-slate-400">{{ t("totalEvents") }}</span>
                <span class="font-bold text-slate-900 dark:text-white">{{ dashboard.active_events }}</span>
              </div>
              <div class="flex items-center justify-between text-xs">
                <span class="text-slate-500 dark:text-slate-400">{{ t("totalBookings") }}</span>
                <span class="font-bold text-slate-900 dark:text-white">{{ dashboard.total_bookings }}</span>
              </div>
              <div class="flex items-center justify-between text-xs">
                <span class="text-slate-500 dark:text-slate-400">{{ t("pendingBookings") }}</span>
                <span class="font-bold text-amber-600">{{ dashboard.pending_bookings }}</span>
              </div>
              <div class="flex items-center justify-between text-xs">
                <span class="text-slate-500 dark:text-slate-400">{{ t("totalUsers") }}</span>
                <span class="font-bold text-slate-900 dark:text-white">{{ dashboard.total_users }}</span>
              </div>
              <div class="flex items-center justify-between text-xs">
                <span class="text-slate-500 dark:text-slate-400">{{ t("totalOrganizers") }}</span>
                <span class="font-bold text-slate-900 dark:text-white">{{ dashboard.verified_organizers }}</span>
              </div>
              <div class="flex items-center justify-between text-xs">
                <span class="text-slate-500 dark:text-slate-400">{{ t("ticketsSold") }}</span>
                <span class="font-bold text-slate-900 dark:text-white">{{ dashboard.total_tickets_sold }}</span>
              </div>
            </div>
          </div>

          <!-- Quick Summary Box -->
          <div class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800">
            <h3 class="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 dark:text-slate-400">{{ t("adminPermissionMatrix") }}</h3>
            <div class="flex flex-wrap gap-1.5">
              <span
                v-for="mod in ['manage_users', 'manage_organizers', 'manage_venues', 'manage_categories', 'manage_events', 'manage_ticket_types', 'manage_bookings', 'manage_payments', 'manage_reviews', 'manage_checkins', 'view_dashboard']"
                :key="mod"
                class="rounded-md bg-amber-50 border border-amber-200/80 px-2 py-0.5 text-[10px] font-mono font-medium text-amber-800 dark:bg-amber-500/10 dark:border-amber-500/30 dark:text-amber-400"
              >
                {{ mod }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </template>
  </main>
</template>
