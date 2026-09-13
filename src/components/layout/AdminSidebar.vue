<script setup>
import { computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
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
  TicketCheck,
  Sun,
  Moon,
} from "lucide-vue-next";
import { useAuthStore } from "../../stores/auth.js";
import { useTheme } from "../../composables/useTheme.js";
import LanguageSwitcher from "../common/LanguageSwitcher.vue";

const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const auth = useAuthStore();
const { isDark, toggle } = useTheme();

const navSections = computed(() => [
  {
    title: t("overview"),
    items: [
      { key: "overview", label: t("dashboard"), permission: "view_dashboard", icon: LayoutGrid, to: "/admin/overview" },
    ],
  },
  {
    title: t("catalogEvents"),
    items: [
      { key: "events", label: t("events"), permission: "manage_events", icon: Calendar, to: "/admin/events" },
      { key: "categories", label: t("categories"), permission: "manage_categories", icon: Layers, to: "/admin/categories" },
      { key: "venues", label: t("venues"), permission: "manage_venues", icon: MapPin, to: "/admin/venues" },
      { key: "tickets", label: t("ticketTypes"), permission: "manage_ticket_types", icon: Ticket, to: "/admin/tickets" },
    ],
  },
  {
    title: t("salesOperations"),
    items: [
      { key: "bookings", label: t("bookings"), permission: "manage_bookings", icon: ShoppingBag, to: "/admin/bookings" },
      { key: "customer-tickets", label: t("tickets"), permission: "manage_tickets", icon: TicketCheck, to: "/admin/customer-tickets" },
      { key: "payments", label: t("payments"), permission: "manage_payments", icon: CreditCard, to: "/admin/payments" },
      { key: "checkins", label: t("checkIns"), permission: "manage_checkins", icon: QrCode, to: "/admin/check-ins" },
      { key: "reviews", label: t("reviews"), permission: "manage_reviews", icon: Star, to: "/admin/reviews" },
    ],
  },
  {
    title: t("userManagement"),
    items: [
      { key: "organizers", label: t("organizers"), permission: "manage_organizers", icon: Building2, to: "/admin/organizers" },
      { key: "users", label: t("users"), permission: "manage_users", icon: Users, to: "/admin/users" },
    ],
  },
]);

const active = computed(() => route.meta?.navKey || "");

// Logout invalidates the JWT on the server via the Pinia auth store, clears
// the local session (localStorage + store snapshot), then returns to /login.
async function handleLogout() {
  try {
    await auth.logout();
  } finally {
    router.push("/login");
  }
}
</script>

<template>
  <aside class="sticky top-0 flex h-screen w-64 shrink-0 flex-col justify-between border-r border-slate-200 bg-white px-4 py-5 shadow-sm overflow-y-auto dark:border-slate-700 dark:bg-slate-800">
    <div>
      <!-- Brand -->
      <div class="mb-6 flex items-center gap-2 px-0">
        <div class="flex h-10 w-14 items-center justify-center rounded-xl bg-amber-500 font-bold text-slate-950 shadow-md shadow-amber-500/20">
          <Ticket :size="22" :stroke-width="2.5" />
        </div>
        <div class="flex-1">
          <p class="text-sm font-bold leading-tight text-slate-900 dark:text-white">EventHub</p>
          <p class="text-[11px] font-medium leading-tight text-amber-600">{{ t('admin') }}</p>
        </div>
        <LanguageSwitcher />
        <button
          type="button"
          @click="toggle"
          class="flex h-8 w-8 items-center justify-center hover:text-slate-300  text-slate-400 transition-colors"
          :aria-label="isDark ? t('switchToLightMode') : t('switchToDarkMode')"
        >
          <Moon v-if="!isDark" :size="16"    />
          <Sun v-else :size="16" :stroke-width="2" />
        </button>
        
      </div>

      <!-- Quick Action -->
      <RouterLink
        to="/admin/events"
        class="mb-6 flex items-center justify-center gap-2 rounded-lg bg-amber-500 px-3 py-2 text-xs font-semibold text-slate-950 shadow-sm transition-all hover:bg-amber-600 hover:shadow"
      >
        <Plus :size="15" :stroke-width="2.5" />
        {{ t('createNewEvent') }}
      </RouterLink>

      <!-- Navigation Sections -->
      <div class="space-y-5">
        <div v-for="section in navSections" :key="section.title">
          <p class="mb-1.5 px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
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
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-white'"
            >
              <component :is="item.icon" :size="16" :stroke-width="item.key === active ? 2.5 : 2" />
              <span>{{ item.label }}</span>
            </RouterLink>
          </nav>
        </div>
      </div>
    </div>

    <!-- Bottom Settings & Logout -->
    <div class="mt-6 border-t border-slate-200 pt-3 flex flex-col gap-1 dark:border-slate-700">
      <RouterLink
        to="/admin/settings"
        class="flex items-center gap-3 rounded-lg px-3 py-2 text-xs font-medium transition-colors"
        :class="active === 'settings'
          ? 'bg-amber-500 text-slate-950 font-semibold shadow-sm'
          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-white'"
      >
        <Settings :size="16" :stroke-width="2" />
        {{ t('platformSettings') }}
      </RouterLink>
      <button
        type="button"
        @click="handleLogout"
        class="flex items-center gap-3 rounded-lg px-3 py-2 text-left text-xs font-medium text-rose-600 transition-colors hover:bg-rose-50 hover:text-rose-700 dark:text-rose-400 dark:hover:bg-rose-500/10 dark:hover:text-rose-300"
      >
        <LogOut :size="16" :stroke-width="2" />
        {{ t('signOut') }}
      </button>
    </div>
  </aside>
</template>
