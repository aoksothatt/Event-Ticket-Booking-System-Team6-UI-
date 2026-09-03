<script setup>
import { ref, computed } from "vue";
import { useRouter } from "vue-router";
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
} from "lucide-vue-next";

const router = useRouter();
const searchQuery = ref("");

const stats = [
  {
    label: "Total Gross Revenue",
    value: "$1,248,500",
    change: "+14.5% vs last month",
    trend: "up",
    icon: DollarSign,
    color: "bg-amber-50 text-amber-600",
  },
  {
    label: "Total Bookings",
    value: "6,418",
    change: "+8.2% vs last month",
    trend: "up",
    icon: ShoppingBag,
    color: "bg-orange-50 text-orange-600",
  },
  {
    label: "Active Events",
    value: "342",
    change: "+22 new this week",
    trend: "up",
    icon: Calendar,
    color: "bg-blue-50 text-blue-600",
  },
  {
    label: "Checked-in Attendees",
    value: "14,890",
    change: "76.4% check-in rate",
    trend: "up",
    icon: QrCode,
    color: "bg-indigo-50 text-indigo-600",
  },
  {
    label: "Registered Users",
    value: "18,920",
    change: "+340 this week",
    trend: "up",
    icon: Users,
    color: "bg-emerald-50 text-emerald-600",
  },
  {
    label: "Verified Organizers",
    value: "128",
    change: "81% verification rate",
    trend: "up",
    icon: Building2,
    color: "bg-purple-50 text-purple-600",
  },
];

const managementModules = [
  { name: "Events", count: "342 active", permission: "manage_events", to: "/admin/events", icon: Calendar, color: "text-amber-600 bg-amber-50 border-amber-200" },
  { name: "Categories", count: "12 types", permission: "manage_categories", to: "/admin/categories", icon: Layers, color: "text-sky-600 bg-sky-50 border-sky-200" },
  { name: "Venues", count: "48 locations", permission: "manage_venues", to: "/admin/venues", icon: MapPin, color: "text-emerald-600 bg-emerald-50 border-emerald-200" },
  { name: "Ticket Types", count: "180 tiers", permission: "manage_ticket_types", to: "/admin/tickets", icon: Ticket, color: "text-purple-600 bg-purple-50 border-purple-200" },
  { name: "Bookings", count: "6.4k orders", permission: "manage_bookings", to: "/admin/bookings", icon: ShoppingBag, color: "text-orange-600 bg-orange-50 border-orange-200" },
  { name: "Payments", count: "$1.24M paid", permission: "manage_payments", to: "/admin/payments", icon: CreditCard, color: "text-emerald-600 bg-emerald-50 border-emerald-200" },
  { name: "Check-Ins", count: "14.8k scanned", permission: "manage_checkins", to: "/admin/check-ins", icon: QrCode, color: "text-indigo-600 bg-indigo-50 border-indigo-200" },
  { name: "Reviews", count: "4.8 avg (1.2k)", permission: "manage_reviews", to: "/admin/reviews", icon: Star, color: "text-yellow-600 bg-yellow-50 border-yellow-200" },
  { name: "Organizers", count: "128 hosts", permission: "manage_organizers", to: "/admin/organizers", icon: Building2, color: "text-rose-600 bg-rose-50 border-rose-200" },
  { name: "Users", count: "18.9k members", permission: "manage_users", to: "/admin/users", icon: Users, color: "text-teal-600 bg-teal-50 border-teal-200" },
];

const recentBookings = ref([
  {
    id: 1,
    booking_number: "BK-88291A",
    user: { name: "Sarah Jenkins", email: "sarah.j@example.com", initials: "SJ" },
    event: { title: "Neon Nights Music Festival", venue: "Riverside Amphitheater" },
    booking_date: "Today at 02:45 PM",
    total_amount: "$250.00",
    payment_method: "ABA Pay (KHQR)",
    payment_status: "paid",
    status: "confirmed",
  },
  {
    id: 2,
    booking_number: "BK-88290B",
    user: { name: "Marcus Reed", email: "marcus.reed@email.com", initials: "MR" },
    event: { title: "Symphony in the Park 2024", venue: "Central Park Meadow" },
    booking_date: "Today at 01:20 PM",
    total_amount: "$85.00",
    payment_method: "Credit Card",
    payment_status: "paid",
    status: "confirmed",
  },
  {
    id: 3,
    booking_number: "BK-88289C",
    user: { name: "Elena Rodriguez", email: "elena.r@ventures.io", initials: "ER" },
    event: { title: "Global Tech Summit 2024 (VIP)", venue: "Convention Center" },
    booking_date: "Yesterday at 06:10 PM",
    total_amount: "$1,200.00",
    payment_method: "Credit Card",
    payment_status: "paid",
    status: "confirmed",
  },
  {
    id: 4,
    booking_number: "BK-88288D",
    user: { name: "Thomas Chen", email: "thomas.c@cloudmail.com", initials: "TC" },
    event: { title: "Underground Comedy Night", venue: "Cellar Lounge" },
    booking_date: "Yesterday at 04:30 PM",
    total_amount: "$45.00",
    payment_method: "PayPal",
    payment_status: "pending",
    status: "pending",
  },
  {
    id: 5,
    booking_number: "BK-88287E",
    user: { name: "Priya Nair", email: "priya.nair@webmail.org", initials: "PN" },
    event: { title: "Modern Art Gala & Exhibition", venue: "Metropolitan Hall" },
    booking_date: "2 days ago",
    total_amount: "$150.00",
    payment_method: "ABA Pay",
    payment_status: "paid",
    status: "completed",
  },
]);

const recentActivities = [
  { text: "Sarah Jenkins checked into Neon Nights Festival", time: "5 mins ago", icon: QrCode, color: "text-emerald-600 bg-emerald-50" },
  { text: "New 5-star review submitted for Global Tech Summit", time: "18 mins ago", icon: Star, color: "text-amber-600 bg-amber-50" },
  { text: "Organizer 'Wavelength Live' published a new event", time: "1 hour ago", icon: Calendar, color: "text-sky-600 bg-sky-50" },
  { text: "Payment of $1,200.00 settled via Credit Card", time: "2 hours ago", icon: CreditCard, color: "text-emerald-600 bg-emerald-50" },
];

const filteredBookings = computed(() => {
  if (!searchQuery.value) return recentBookings.value;
  const q = searchQuery.value.toLowerCase();
  return recentBookings.value.filter(
    (b) =>
      b.booking_number.toLowerCase().includes(q) ||
      b.user.name.toLowerCase().includes(q) ||
      b.user.email.toLowerCase().includes(q) ||
      b.event.title.toLowerCase().includes(q)
  );
});

const statusBadge = {
  confirmed: "bg-emerald-50 text-emerald-700 border-emerald-200",
  completed: "bg-sky-50 text-sky-700 border-sky-200",
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  cancelled: "bg-rose-50 text-rose-700 border-rose-200",
};

const paymentBadge = {
  paid: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  pending: "bg-amber-50 text-amber-700 border border-amber-200",
  failed: "bg-rose-50 text-rose-700 border border-rose-200",
  refunded: "bg-purple-50 text-purple-700 border border-purple-200",
};
</script>

<template>
  <main class="min-h-screen flex-1 bg-slate-50 px-8 py-8 text-slate-800">
    <!-- Header -->
    <div class="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <div class="flex items-center gap-2.5">
          <h1 class="text-3xl font-extrabold tracking-tight text-slate-900">Admin Dashboard</h1>
          <span class="rounded-full bg-amber-100 border border-amber-200 px-3 py-0.5 text-xs font-semibold text-amber-800">
            Platform Master Control
          </span>
        </div>
        <p class="mt-1 text-sm text-slate-500">
          Real-time platform overview, catalog management, bookings, payments, and operations.
        </p>
      </div>

      <div class="relative">
        <Search :size="16" class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Search bookings, users, events..."
          class="w-72 rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm text-slate-800 placeholder:text-slate-400 outline-none shadow-sm transition-all focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
        />
      </div>
    </div>

    <!-- 10 Modules Quick Access Grid -->
    <div class="mb-8">
      <div class="mb-3 flex items-center justify-between">
        <h2 class="text-xs font-bold uppercase tracking-wider text-slate-500">Management & Operations Hub</h2>
        <span class="text-xs font-medium text-slate-400">11 Role-Controlled Modules</span>
      </div>
      <div class="grid grid-cols-2 gap-3 sm:grid-cols-5">
        <RouterLink
          v-for="mod in managementModules"
          :key="mod.name"
          :to="mod.to"
          class="group flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm transition-all hover:border-amber-400 hover:shadow-md hover:-translate-y-0.5"
        >
          <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border" :class="mod.color">
            <component :is="mod.icon" :size="18" />
          </div>
          <div class="min-w-0 flex-1">
            <p class="truncate text-xs font-bold text-slate-900 group-hover:text-amber-600">{{ mod.name }}</p>
            <p class="truncate text-[11px] font-medium text-slate-400">{{ mod.count }}</p>
          </div>
        </RouterLink>
      </div>
    </div>

    <!-- Platform Stats Cards -->
    <div class="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3 lg:grid-cols-6">
      <div
        v-for="stat in stats"
        :key="stat.label"
        class="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-all hover:shadow-md"
      >
        <div class="mb-3 flex items-start justify-between">
          <span class="flex h-8 w-8 items-center justify-center rounded-lg shadow-sm" :class="stat.color">
            <component :is="stat.icon" :size="16" />
          </span>
          <span class="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded flex items-center gap-0.5 border border-emerald-100">
            <ArrowUpRight :size="11" />
            Active
          </span>
        </div>
        <p class="text-xs font-medium text-slate-500">{{ stat.label }}</p>
        <p class="text-xl font-bold mt-1 text-slate-900">{{ stat.value }}</p>
        <p class="mt-1 text-[11px] font-medium text-slate-400">{{ stat.change }}</p>
      </div>
    </div>

    <!-- Main Content Grid: Recent Bookings + Live Operations Activity -->
    <div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <!-- Recent Bookings (2 Cols) -->
      <div class="lg:col-span-2 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div class="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div>
            <h2 class="text-base font-bold text-slate-900">Recent Customer Bookings</h2>
            <p class="text-xs text-slate-500">Latest ticket orders with payment status</p>
          </div>
          <RouterLink
            to="/admin/bookings"
            class="text-xs font-semibold text-amber-600 hover:text-amber-700 transition-colors"
          >
            View All Bookings →
          </RouterLink>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full text-left text-sm">
            <thead class="bg-slate-50/70 border-b border-slate-200">
              <tr class="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th class="px-6 py-3">Booking #</th>
                <th class="px-6 py-3">Customer</th>
                <th class="px-6 py-3">Event</th>
                <th class="px-6 py-3">Payment</th>
                <th class="px-6 py-3 text-right">Amount</th>
                <th class="px-6 py-3 text-right">Status</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <tr
                v-for="b in filteredBookings"
                :key="b.id"
                class="transition-colors hover:bg-slate-50/80"
              >
                <td class="px-6 py-3.5 font-mono text-xs text-amber-600 font-semibold">
                  {{ b.booking_number }}
                </td>
                <td class="px-6 py-3.5">
                  <div class="flex items-center gap-2.5">
                    <span class="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 font-bold text-[10px] text-slate-700 border border-slate-200">
                      {{ b.user.initials }}
                    </span>
                    <div>
                      <p class="text-xs font-semibold text-slate-900">{{ b.user.name }}</p>
                      <p class="text-[11px] text-slate-400">{{ b.user.email }}</p>
                    </div>
                  </div>
                </td>
                <td class="px-6 py-3.5">
                  <p class="text-xs font-medium text-slate-800 max-w-[170px] truncate">{{ b.event.title }}</p>
                  <p class="text-[11px] text-slate-400">{{ b.booking_date }}</p>
                </td>
                <td class="px-6 py-3.5">
                  <span class="rounded-md px-2 py-0.5 text-[11px] font-semibold" :class="paymentBadge[b.payment_status]">
                    {{ b.payment_method }}
                  </span>
                </td>
                <td class="px-6 py-3.5 text-right font-bold text-slate-900 text-xs">
                  {{ b.total_amount }}
                </td>
                <td class="px-6 py-3.5 text-right">
                  <span class="rounded-full border px-2.5 py-0.5 text-[10px] font-semibold capitalize" :class="statusBadge[b.status]">
                    {{ b.status }}
                  </span>
                </td>
              </tr>
              <tr v-if="filteredBookings.length === 0">
                <td colspan="6" class="px-6 py-8 text-center text-xs text-slate-400">
                  No bookings found matching query.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Live Activity & Operations Feed (1 Col) -->
      <div class="space-y-4">
        <!-- Live stream -->
        <div class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div class="mb-4 flex items-center justify-between">
            <h2 class="text-sm font-bold text-slate-900">Live Operations Stream</h2>
            <span class="flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
          </div>

          <div class="space-y-3">
            <div
              v-for="(act, idx) in recentActivities"
              :key="idx"
              class="flex items-start gap-3 rounded-lg border border-slate-100 bg-slate-50 p-3"
            >
              <div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg shadow-sm" :class="act.color">
                <component :is="act.icon" :size="15" />
              </div>
              <div class="flex-1 min-w-0">
                <p class="text-xs font-medium text-slate-800 leading-snug">{{ act.text }}</p>
                <p class="mt-1 text-[11px] text-slate-400">{{ act.time }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Quick Summary Box -->
        <div class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 class="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">Admin Permissions Matrix</h3>
          <div class="flex flex-wrap gap-1.5">
            <span
              v-for="mod in ['manage_users', 'manage_organizers', 'manage_venues', 'manage_categories', 'manage_events', 'manage_ticket_types', 'manage_bookings', 'manage_payments', 'manage_reviews', 'manage_checkins', 'view_dashboard']"
              :key="mod"
              class="rounded-md bg-amber-50 border border-amber-200/80 px-2 py-0.5 text-[10px] font-mono font-medium text-amber-800"
            >
              {{ mod }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </main>
</template>
