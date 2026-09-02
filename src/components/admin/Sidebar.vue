<script setup>
import { computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import {
  LayoutGrid,
  Users,
  Building2,
  Calendar,
  Ticket,
  Settings,
  LogOut,
  Plus,
} from "lucide-vue-next";

const route = useRoute();
const router = useRouter();

const navItems = [
  { key: "overview", label: "Overview", icon: LayoutGrid, to: "/admin/overview" },
  { key: "events", label: "Events", icon: Calendar, to: "/admin/events" },
  { key: "organizers", label: "Organizers", icon: Building2, to: "/admin/organizers" },
  { key: "tickets", label: "Tickets", icon: Ticket, to: "/admin/tickets" },
  { key: "users", label: "Users", icon: Users, to: "/admin/users" },
];

const active = computed(() => route.meta?.navKey || "");

function logout() {
  // Can be connected to auth/logout API
  router.push("/admin/overview");
}
</script>

<template>
  <aside class="sticky top-0 flex h-screen w-64 shrink-0 flex-col justify-between border-r border-white/10 bg-[#111113] px-4 py-6">
    <div>
      <!-- Brand -->
      <div class="mb-8 flex items-center gap-3 px-2">
        <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500 font-bold text-black shadow-lg shadow-amber-500/20">
          <Ticket :size="22" :stroke-width="2.5" />
        </div>
        <div>
          <p class="text-sm font-semibold leading-tight text-white">EventHub Admin</p>
          <p class="text-[11px] leading-tight text-white/40">Ticket Management</p>
        </div>
      </div>

      <!-- Nav -->
      <nav class="flex flex-col gap-1.5">
        <RouterLink
          v-for="item in navItems"
          :key="item.key"
          :to="item.to"
          class="flex items-center gap-3 rounded-lg px-3.5 py-2.5 text-sm font-medium transition-all"
          :class="item.key === active
            ? 'bg-amber-500 text-black shadow-md shadow-amber-500/10'
            : 'text-white/60 hover:bg-white/5 hover:text-white'"
        >
          <component :is="item.icon" :size="18" :stroke-width="2" />
          {{ item.label }}
        </RouterLink>
      </nav>
    </div>

    <div class="flex flex-col gap-2">
      <RouterLink
        to="/admin/events"
        class="flex items-center justify-center gap-2 rounded-lg bg-amber-500 px-3 py-2.5 text-sm font-medium text-black transition-opacity hover:opacity-90 shadow-md shadow-amber-500/10"
      >
        <Plus :size="16" :stroke-width="2.5" />
        Create Event
      </RouterLink>

      <div class="mt-2 flex flex-col gap-1 border-t border-white/10 pt-2">
        <RouterLink
          to="/admin/settings"
          class="flex items-center gap-3 rounded-lg px-3.5 py-2.5 text-sm font-medium transition-colors"
          :class="active === 'settings'
            ? 'bg-amber-500 text-black font-medium'
            : 'text-white/60 hover:bg-white/5 hover:text-white'"
        >
          <Settings :size="18" :stroke-width="2" />
          Settings
        </RouterLink>
        <button
          type="button"
          @click="logout"
          class="flex items-center gap-3 rounded-lg px-3.5 py-2.5 text-left text-sm font-medium text-white/60 transition-colors hover:bg-white/5 hover:text-white"
        >
          <LogOut :size="18" :stroke-width="2" />
          Logout
        </button>
      </div>
    </div>
  </aside>
</template>
