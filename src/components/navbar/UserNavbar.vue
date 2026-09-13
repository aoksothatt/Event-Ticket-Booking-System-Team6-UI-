<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import { Home, CalendarDays, Ticket, Heart, Settings, Search, X, Menu, LogIn, UserPlus, User, Sun, Moon } from "lucide-vue-next";
import { useAuthStore } from "../../stores/auth.js";
import { useTheme } from "../../composables/useTheme.js";
import SearchBar from "./SearchBar.vue";
import ProfileDropdown from "./ProfileDropdown.vue";
import LanguageSwitcher from "../common/LanguageSwitcher.vue";

const { t } = useI18n();
const props = defineProps({
  user: { type: Object, default: null },
});

const route = useRoute();
const router = useRouter();
const auth = useAuthStore();
const { isDark, toggle } = useTheme();

const scrolled = ref(false);
const mobileOpen = ref(false);
const mobileSearch = ref(false);

const loggedIn = computed(() => auth.isAuthenticated);
const user = computed(() => props.user || auth.user || {});

// Public links for guests; authenticated links once signed in.
const guestNav = computed(() => [
  { label: t("home"), icon: Home, to: "/home", exact: true },
  { label: t("events"), icon: CalendarDays, to: "/events" },
]);
const authNav = computed(() => [
  { label: t("home"), icon: Home, to: "/home", exact: true },
  { label: t("events"), icon: CalendarDays, to: "/events" },
  { label: t("favorites"), icon: Heart, to: "/favorites" },
  { label: t("myTickets"), icon: Ticket, to: "/my-tickets" },
]);
const navItems = computed(() => (loggedIn.value ? authNav.value : guestNav.value));

function isActive(item) {
  if (item.exact) return route.path === item.to;
  return route.path.startsWith(item.to);
}

function goPath(path) {
  mobileOpen.value = false;
  mobileSearch.value = false;
  router.push(path);
}

function openSearch() {
  mobileSearch.value = true;
  mobileOpen.value = false;
}

function onScroll() {
  scrolled.value = window.scrollY > 24;
}

onMounted(() => {
  window.addEventListener("scroll", onScroll);
  onScroll();
});
onBeforeUnmount(() => window.removeEventListener("scroll", onScroll));
</script>

<template>
  <header class="fixed inset-x-0 top-3 z-40 px-3 sm:top-4 sm:px-6">
    <div
      class="mx-auto max-w-7xl rounded-full border border-slate-200 dark:border-white/10 bg-slate-100/70 dark:bg-[#0B0D10]/70 px-4 shadow-2xl shadow-black/50 backdrop-blur-xl transition-all sm:px-5"
      :class="scrolled ? 'py-1.5' : 'py-2'"
    >
      <div class="flex items-center justify-between gap-3">
        <!-- Logo -->
        <RouterLink to="/home" class="flex shrink-0 items-center gap-2">
          <span class="flex h-8 w-8 items-center justify-center rounded-lg bg-[#FFA500] font-extrabold text-black">
            <Ticket :size="17" />
          </span>
          <span class="hidden text-base font-extrabold tracking-tight text-slate-900 dark:text-white md:block">
            BILIT
          </span>
        </RouterLink>

        <!-- Desktop nav -->
        <nav class="hidden items-center gap-1 lg:flex">
          <button
            v-for="item in navItems"
            :key="item.to"
            type="button"
            :class="isActive(item)
              ? 'bg-[#FFA500]/15 text-white'
              : 'text-slate-500 dark:text-white/60 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white'"
            class="flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-medium transition"
            @click="goPath(item.to)"
          >
            <component :is="item.icon" :size="15" />
            {{ item.label }}
          </button>
        </nav>

        <!-- Right actions -->
        <div class="flex items-center gap-2">
          <!-- Desktop search -->
          <div class="hidden lg:block">
            <SearchBar />
          </div>

          <!-- Theme toggle -->
          <button
            type="button"
            class="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-white/70 transition hover:bg-slate-200 dark:hover:bg-white/10 hover:text-slate-900 dark:hover:text-white"
            :aria-label="isDark ? t('switchToLightMode') : t('switchToDarkMode')"
            @click="toggle"
          >
            <Sun v-if="isDark" :size="16" />
            <Moon v-else :size="16" />
          </button>

          <!-- Language Switcher -->
          <LanguageSwitcher class="flex w-fit h-9 items-center gap-1.5 rounded-full border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-white/5 px-3 text-xs font-semibold text-slate-600 dark:text-white/80 transition hover:border-[#FFA500]/40 hover:bg-slate-200 dark:hover:bg-white/10 hover:text-slate-900 dark:hover:text-white" />

          <!-- Guest: quick sign-in / sign-up actions -->
          <template v-if="!loggedIn">
            <RouterLink
              to="/login"
              class="hidden h-9 items-center gap-1.5 rounded-full border border-slate-200 dark:border-white/15 bg-slate-100 dark:bg-white/5 px-3.5 text-sm font-semibold text-slate-600 dark:text-white/80 transition hover:bg-slate-200 dark:hover:bg-white/10 hover:text-slate-900 dark:hover:text-white sm:flex"
            >
              <LogIn :size="15" />
              {{ t('login') }}
            </RouterLink>
            <RouterLink
              to="/register"
              class="hidden h-9 items-center gap-1.5 rounded-full bg-[#FFA500] px-3.5 text-sm font-bold text-black transition hover:bg-[#FFB52E] sm:flex"
            >
              <UserPlus :size="15" />
              {{ t('register') }}
            </RouterLink>
          </template>

          <!-- Authenticated: settings -->
          <button
            v-if="loggedIn"
            type="button"
            class="hidden h-9 w-9 items-center justify-center rounded-full border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-white/70 transition hover:bg-slate-200 dark:hover:bg-white/10 hover:text-slate-900 dark:hover:text-white sm:flex"
            :aria-label="route.path === '/settings' ? t('settings') : t('openSettings')"
            :class="route.path === '/settings' ? 'text-[#FFA500]' : ''"
            @click="goPath('/settings')"
          >
            <Settings :size="17" />
          </button>

          <!-- Mobile search toggle -->
          <button
            type="button"
            class="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-white/70 transition hover:bg-slate-200 dark:hover:bg-white/10 hover:text-slate-900 dark:hover:text-white lg:hidden"
            :aria-label="mobileSearch ? t('close') : t('search')"
            @click="mobileSearch ? (mobileSearch = false) : openSearch()"
          >
            <Search v-if="!mobileSearch" :size="16" />
            <X v-else :size="16" />
          </button>

          <!-- Profile dropdown (authenticated users only) -->
          <ProfileDropdown v-if="loggedIn" :user="user" />

          <!-- Mobile hamburger -->
          <button
            type="button"
            class="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-white/70 transition hover:bg-slate-200 dark:hover:bg-white/10 hover:text-slate-900 dark:hover:text-white lg:hidden"
            :aria-label="mobileOpen ? t('close') : t('search')"
            @click="mobileOpen = !mobileOpen"
          >
            <Menu v-if="!mobileOpen" :size="17" />
            <X v-else :size="17" />
          </button>
        </div>
      </div>

      <!-- Mobile search expansion -->
      <div v-if="mobileSearch" class="mt-3 pb-0.5 lg:hidden">
        <SearchBar @submit="mobileSearch = false" />
      </div>
    </div>

    <!-- Mobile nav drawer -->
    <transition
      enter-active-class="transition duration-150 ease-out"
      enter-from-class="-translate-y-1 opacity-0"
      enter-to-class="translate-y-0 opacity-100"
      leave-active-class="transition duration-100 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="mobileOpen"
        class="mx-auto mt-2 max-w-7xl rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-100/95 dark:bg-[#0B0D10]/95 p-2 shadow-2xl shadow-black/60 backdrop-blur-xl lg:hidden"
      >
        <button
          v-for="item in navItems"
          :key="item.to"
          type="button"
          :class="isActive(item) ? 'bg-[#FFA500]/15 text-white' : 'text-slate-600 dark:text-white/70'"
          class="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-medium transition hover:bg-slate-100 dark:hover:bg-white/5"
          @click="goPath(item.to)"
        >
          <component :is="item.icon" :size="17" />
          {{ item.label }}
        </button>

        <!-- Guest: auth actions in the mobile drawer -->
        <template v-if="!loggedIn">
          <button
            type="button"
            class="mt-1 flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-medium text-slate-600 dark:text-white/70 transition hover:bg-slate-100 dark:hover:bg-white/5"
            @click="goPath('/login')"
          >
            <LogIn :size="17" />
            {{ t('login') }}
          </button>
          <button
            type="button"
            class="mt-1 flex w-full items-center gap-3 rounded-xl bg-[#FFA500] px-4 py-3 text-left text-sm font-bold text-black transition hover:bg-[#FFB52E]"
            @click="goPath('/register')"
          >
            <UserPlus :size="17" />
            {{ t('register') }}
          </button>
        </template>

        <!-- Authenticated: profile + settings in the mobile drawer -->
        <template v-if="loggedIn">
          <button
            type="button"
          :class="route.path === '/profile' ? 'bg-[#FFA500]/15 text-white' : 'text-slate-600 dark:text-white/70'"
          class="mt-1 flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-medium transition hover:bg-slate-100 dark:hover:bg-white/5"
            @click="goPath('/profile')"
          >
            <User :size="17" />
            {{ t('profile') }}
          </button>
          <button
            type="button"
          :class="route.path === '/settings' ? 'bg-[#FFA500]/15 text-white' : 'text-slate-600 dark:text-white/70'"
          class="mt-1 flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-medium transition hover:bg-slate-100 dark:hover:bg-white/5"
            @click="goPath('/settings')"
          >
            <Settings :size="17" />
            {{ t('settings') }}
          </button>
        </template>
      </div>
    </transition>
  </header>
</template>
