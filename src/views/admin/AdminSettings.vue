<script setup>
import { ref, computed, onMounted } from "vue";
import { useI18n } from "vue-i18n";
import { settingsApi } from "@/api/settingsApi.js";
import {
  Loader2,
  AlertCircle,
  RefreshCw,
  Settings,
  Palette,
  Ticket,
  CreditCard,
  Bell,
  Users,
  CalendarDays,
  Cpu,
} from "lucide-vue-next";
import GeneralSettingsSection from "./settings/GeneralSettingsSection.vue";
import AppearanceSettingsSection from "./settings/AppearanceSettingsSection.vue";
import BookingSettingsSection from "./settings/BookingSettingsSection.vue";
import PaymentSettingsSection from "./settings/PaymentSettingsSection.vue";
import NotificationSettingsSection from "./settings/NotificationSettingsSection.vue";
import UserSettingsSection from "./settings/UserSettingsSection.vue";
import EventTicketSettingsSection from "./settings/EventTicketSettingsSection.vue";
import SystemSettingsSection from "./settings/SystemSettingsSection.vue";

const { t } = useI18n();

const loading = ref(true);
const loadError = ref("");
const settings = ref({});
const activeTab = ref("general");

const tabs = [
  { key: "general", icon: Settings, labelKey: "settingsTabGeneral", descKey: "settingsTabGeneralDesc" },
  { key: "appearance", icon: Palette, labelKey: "settingsTabAppearance", descKey: "settingsTabAppearanceDesc" },
  { key: "booking", icon: Ticket, labelKey: "settingsTabBooking", descKey: "settingsTabBookingDesc" },
  { key: "payment", icon: CreditCard, labelKey: "settingsTabPayment", descKey: "settingsTabPaymentDesc" },
  { key: "notification", icon: Bell, labelKey: "settingsTabNotifications", descKey: "settingsTabNotificationsDesc" },
  { key: "user", icon: Users, labelKey: "settingsTabUsers", descKey: "settingsTabUsersDesc" },
  { key: "event", icon: CalendarDays, labelKey: "settingsTabEventTicket", descKey: "settingsTabEventTicketDesc" },
  { key: "system", icon: Cpu, labelKey: "settingsTabSystem", descKey: "settingsTabSystemDesc" },
];

const sectionMap = {
  general: GeneralSettingsSection,
  appearance: AppearanceSettingsSection,
  booking: BookingSettingsSection,
  payment: PaymentSettingsSection,
  notification: NotificationSettingsSection,
  user: UserSettingsSection,
  event: EventTicketSettingsSection,
  system: SystemSettingsSection,
};

const ActiveSection = computed(() => sectionMap[activeTab.value]);
const activeTabMeta = computed(() => tabs.find((t) => t.key === activeTab.value));

async function loadSettings() {
  loading.value = true;
  loadError.value = "";
  try {
    const res = await settingsApi.getSettings();
    settings.value = res?.data?.settings || {};
  } catch (e) {
    loadError.value = e?.response?.data?.message || e?.message || t("errorMessage");
  } finally {
    loading.value = false;
  }
}

function handleSaved(newSettings) {
  // The backend returns the full resolved settings after an update, so the
  // active section re-syncs its form from this snapshot — no page reload.
  if (newSettings && typeof newSettings === "object" && Object.keys(newSettings).length) {
    settings.value = newSettings;
  } else {
    loadSettings();
  }
}

onMounted(loadSettings);
</script>

<template>
  <main class="min-h-screen flex-1 bg-slate-50 dark:bg-slate-900 px-8 py-8 text-slate-800 dark:text-slate-100">
    <!-- Header -->
    <div class="mb-8 flex items-center justify-between">
      <div>
        <div class="flex items-center gap-2.5">
          <h1 class="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">{{ t('platformSettings') }}</h1>
          <span class="rounded-md bg-teal-100 border border-teal-200 px-2.5 py-0.5 text-xs text-teal-800 font-mono font-medium dark:bg-teal-500/15 dark:border-teal-500/30 dark:text-teal-400">
            manage_settings
          </span>
        </div>
        <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">{{ t('settingsCenterDesc') }}</p>
      </div>
      <button
        type="button"
        @click="loadSettings"
        :disabled="loading"
        class="flex items-center gap-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm font-semibold text-slate-600 dark:text-slate-300 shadow-sm transition-all hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
      >
        <RefreshCw :size="15" :class="loading ? 'animate-spin' : ''" />
        {{ t('settingsReloadValues') }}
      </button>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="flex flex-col items-center justify-center py-20">
      <Loader2 :size="36" class="animate-spin text-primary" />
      <p class="mt-3 text-sm text-slate-500 dark:text-slate-400">{{ t('loading') }}</p>
    </div>

    <!-- Error State -->
    <div v-else-if="loadError" class="rounded-xl border border-rose-200 bg-rose-50 p-8 text-center dark:border-rose-500/30 dark:bg-rose-500/10">
      <AlertCircle :size="28" class="mx-auto text-rose-500" />
      <p class="mt-2 text-sm font-semibold text-rose-700 dark:text-rose-400">{{ loadError }}</p>
      <button
        @click="loadSettings"
        class="mt-3 rounded-lg bg-rose-500 px-4 py-2 text-xs font-semibold text-white hover:bg-rose-600"
      >
        {{ t('retry') }}
      </button>
    </div>

    <!-- Settings Center -->
    <div v-else class="grid grid-cols-1 gap-6 lg:grid-cols-[260px_1fr]">
      <!-- Tab rail -->
      <aside class="h-fit rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-2 shadow-sm lg:sticky lg:top-6">
        <nav class="space-y-1">
          <button
            v-for="tab in tabs"
            :key="tab.key"
            type="button"
            @click="activeTab = tab.key"
            class="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors"
            :class="activeTab === tab.key
              ? 'bg-primary/10 text-primary-accent border border-primary/30'
              : 'border border-transparent text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700/60 hover:text-slate-900 dark:hover:text-white'"
          >
            <component :is="tab.icon" :size="17" />
            {{ t(tab.labelKey) }}
          </button>
        </nav>
      </aside>

      <!-- Active section -->
      <section class="min-w-0">
        <div class="mb-4 flex items-center justify-between">
          <div>
            <h2 class="text-lg font-bold text-slate-900 dark:text-white">{{ t(activeTabMeta.labelKey) }}</h2>
            <p class="text-sm text-slate-500 dark:text-slate-400">{{ t(activeTabMeta.descKey) }}</p>
          </div>
        </div>

        <KeepAlive>
          <component :is="ActiveSection" :settings="settings" @saved="handleSaved" />
        </KeepAlive>
      </section>
    </div>
  </main>
</template>