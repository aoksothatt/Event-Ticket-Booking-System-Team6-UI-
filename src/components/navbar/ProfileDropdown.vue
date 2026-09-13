<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { User, Ticket, Heart, Settings, LogOut, ChevronDown, LayoutGrid } from "lucide-vue-next";
import { useAuthStore } from "../../stores/auth.js";
import { STORAGE_BASE } from "../../api/http.js";
import { toast } from "../../composables/useToast.js";
import { useI18n } from "vue-i18n";

const { t } = useI18n();

const props = defineProps({
  user: { type: Object, default: null },
});

const router = useRouter();
const auth = useAuthStore();
const open = ref(false);
const menu = ref(null);

const loggedIn = computed(() => auth.isAuthenticated);
const displayUser = computed(() => props.user || auth.user || {});

const initials = computed(() => {
  const name = String(displayUser.value?.name || "U");
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] || "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (first + last).toUpperCase();
});

const avatarUrl = computed(() => {
  const avatar = displayUser.value?.avatar;
  if (!avatar) return null;
  return avatar.startsWith("http") || avatar.startsWith("/") ? avatar : `${STORAGE_BASE}/${avatar}`;
});

function toggle() {
  open.value = !open.value;
}

function go(path) {
  open.value = false;
  router.push(path);
}

async function handleLogout() {
  open.value = false;
  try {
    await auth.logout();
  } finally {
    // The 401/network edge case still leaves the local session cleared by
    // authApi.logout(); make sure the UI reflects that either way.
    toast(t('signedOut'), "info");
    router.push("/home");
  }
}

function onClickOutside(event) {
  if (menu.value && !menu.value.contains(event.target)) {
    open.value = false;
  }
}

onMounted(() => document.addEventListener("click", onClickOutside));
onBeforeUnmount(() => document.removeEventListener("click", onClickOutside));

const items = computed(() => {
  const list = [];
  if (auth.isAdmin) {
    list.push({ label: t('adminDashboard'), icon: LayoutGrid, to: "/admin/overview" });
  }
  list.push(
    { label: t('myProfile'), icon: User, to: "/profile" },
    { label: t('myTickets'), icon: Ticket, to: "/my-tickets" },
    { label: t('favorites'), icon: Heart, to: "/favorites" },
    { label: t('settings'), icon: Settings, to: "/settings" }
  );
  return list;
});
</script>

<template>
  <div v-if="loggedIn" ref="menu" class="relative">
    <button
      type="button"
      class="flex items-center gap-1.5 rounded-full border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-white/5 p-1 transition hover:bg-slate-200 dark:hover:bg-white/10"
      :aria-label="t('accountMenuFor', { name: displayUser?.name || 'user' })"
      aria-haspopup="true"
      :aria-expanded="open"
      @click="toggle"
    >
      <span class="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-[#FFA500] text-xs font-bold text-black">
        <img v-if="avatarUrl" :src="avatarUrl" alt="" class="h-full w-full object-cover" />
        <template v-else>{{ initials }}</template>
      </span>
      <ChevronDown :size="14" class="hidden text-slate-500 dark:text-white/60 sm:block" :class="open ? 'rotate-180' : ''" />
    </button>

    <transition
      enter-active-class="transition duration-150 ease-out"
      enter-from-class="-translate-y-1 scale-95 opacity-0"
      enter-to-class="translate-y-0 scale-100 opacity-100"
      leave-active-class="transition duration-100 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="open"
        class="absolute right-0 top-11 z-30 w-60 origin-top-right rounded-2xl border border-slate-200 dark:border-white/10 bg-white/95 dark:bg-[#14171C]/95 p-2 shadow-2xl shadow-black/60 backdrop-blur-xl"
        role="menu"
      >
        <div class="border-b border-slate-200 dark:border-white/5 px-3 py-2.5">
          <p class="truncate text-sm font-semibold text-slate-900 dark:text-white">{{ displayUser?.name }}</p>
          <p class="truncate text-xs text-slate-500 dark:text-[#9CA3AF]">{{ displayUser?.email }}</p>
        </div>

        <button
          v-for="item in items"
          :key="item.to"
          type="button"
          role="menuitem"
          class="mt-1 flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-slate-600 dark:text-white/80 transition hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white"
          @click="go(item.to)"
        >
          <component :is="item.icon" :size="16" class="text-slate-500 dark:text-[#9CA3AF]" />
          {{ item.label }}
        </button>

        <button
          type="button"
          role="menuitem"
          class="mt-1 flex w-full items-center gap-3 rounded-lg border-t border-slate-200 dark:border-white/5 px-3 py-2 text-sm text-red-400 transition hover:bg-red-500/10"
          @click="handleLogout"
        >
          <LogOut :size="16" />
          {{ t('logout') }}
        </button>
      </div>
    </transition>
  </div>

  <RouterLink
    v-else
    to="/login"
    class="rounded-full bg-[#FFA500] px-4 py-1.5 text-xs font-bold text-black shadow-sm transition hover:bg-[#FFB52E]"
  >
    {{ t('signIn') }}
  </RouterLink>
</template>
