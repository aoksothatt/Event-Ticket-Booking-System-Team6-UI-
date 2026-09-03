<script setup>
import { computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import {
  LayoutGrid,
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
  Settings,
  LogOut,
  Plus,
} from "lucide-vue-next";

const route = useRoute();
const router = useRouter();

const navSections = [
  {
    title: "Overview",
    items: [
      { key: "overview", label: "Dashboard", permission: "view_dashboard", icon: LayoutGrid, to: "/admin/overview" },
    ],
  },
  {
    title: "Catalog & Events",
    items: [
      { key: "events", label: "Events", permission: "manage_events", icon: Calendar, to: "/admin/events" },
      { key: "categories", label: "Categories", permission: "manage_categories", icon: Layers, to: "/admin/categories" },
      { key: "venues", label: "Venues", permission: "manage_venues", icon: MapPin, to: "/admin/venues" },
      { key: "tickets", label: "Ticket Types", permission: "manage_ticket_types", icon: Ticket, to: "/admin/tickets" },
    ],
  },
  {
    title: "Sales & Operations",
    items: [
      { key: "bookings", label: "Bookings", permission: "manage_bookings", icon: ShoppingBag, to: "/admin/bookings" },
      { key: "payments", label: "Payments", permission: "manage_payments", icon: CreditCard, to: "/admin/payments" },
      { key: "checkins", label: "Check-Ins", permission: "manage_checkins", icon: QrCode, to: "/admin/check-ins" },
      { key: "reviews", label: "Reviews", permission: "manage_reviews", icon: Star, to: "/admin/reviews" },
    ],
  },
  {
    title: "User Management",
    items: [
      { key: "organizers", label: "Organizers", permission: "manage_organizers", icon: Building2, to: "/admin/organizers" },
      { key: "users", label: "Users", permission: "manage_users", icon: Users, to: "/admin/users" },
    ],
  },
];

const active = computed(() => route.meta?.navKey || "");

function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  router.push("/admin/overview");
}
</script>

<template>
  <aside class="sticky top-0 flex h-screen w-64 shrink-0 flex-col justify-between border-r border-slate-200 bg-white px-4 py-5 shadow-sm overflow-y-auto">
    <div>
      <!-- Brand -->
      <div class="mb-6 flex items-center gap-3 px-2">
        <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500 font-bold text-slate-950 shadow-md shadow-amber-500/20">
          <Ticket :size="22" :stroke-width="2.5" />
        </div>
        <div>
          <p class="text-sm font-bold leading-tight text-slate-900">EventHub</p>
          <p class="text-[11px] font-medium leading-tight text-amber-600">Admin Workspace</p>
        </div>
      </div>

      <!-- Quick Action -->
      <RouterLink
        to="/admin/events"
        class="mb-6 flex items-center justify-center gap-2 rounded-lg bg-amber-500 px-3 py-2 text-xs font-semibold text-slate-950 shadow-sm transition-all hover:bg-amber-600 hover:shadow"
      >
        <Plus :size="15" :stroke-width="2.5" />
        Create New Event
      </RouterLink>

      <!-- Navigation Sections -->
      <div class="space-y-5">
        <div v-for="section in navSections" :key="section.title">
          <p class="mb-1.5 px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">
            {{ section.title }}
          </p>
          <nav class="flex flex-col gap-1">
            <RouterLink
              v-for="item in section.items"
              :key="item.key"
              :to="item.to"
              class="flex items-center gap-3 rounded-lg px-3 py-2 text-xs font-medium transition-all"
              :class="item.key === active
                ? 'bg-amber-500 text-slate-950 font-semibold shadow-sm'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'"
            >
              <component :is="item.icon" :size="16" :stroke-width="item.key === active ? 2.5 : 2" />
              <span>{{ item.label }}</span>
            </RouterLink>
          </nav>
        </div>
      </div>
    </div>

    <!-- Bottom Settings & Logout -->
    <div class="mt-6 border-t border-slate-200 pt-3 flex flex-col gap-1">
      <RouterLink
        to="/admin/settings"
        class="flex items-center gap-3 rounded-lg px-3 py-2 text-xs font-medium transition-colors"
        :class="active === 'settings'
          ? 'bg-amber-500 text-slate-950 font-semibold shadow-sm'
          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'"
      >
        <Settings :size="16" :stroke-width="2" />
        Platform Settings
      </RouterLink>
      <button
        type="button"
        @click="logout"
        class="flex items-center gap-3 rounded-lg px-3 py-2 text-left text-xs font-medium text-rose-600 transition-colors hover:bg-rose-50 hover:text-rose-700"
      >
        <LogOut :size="16" :stroke-width="2" />
        Sign Out
      </button>
    </div>
  </aside>
</template>
