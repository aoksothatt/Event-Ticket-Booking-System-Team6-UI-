<script setup>
import { ref } from "vue";
import { useI18n } from "vue-i18n";
import { Check, ShieldCheck, Bell, Server, Globe, Mail } from "lucide-vue-next";

const { t } = useI18n();

const platformName = ref("EventHub");
const supportEmail = ref("support@eventhub.com");
const currency = ref("USD ($)");
const emailNotifications = ref(true);
const maintenanceMode = ref(false);
const showSavedAlert = ref(false);

function saveChanges() {
  showSavedAlert.value = true;
  setTimeout(() => {
    showSavedAlert.value = false;
  }, 3000);
}
</script>

<template>
  <main class="min-h-screen flex-1 bg-slate-50 dark:bg-slate-900 px-8 py-8 text-slate-800 dark:text-slate-100">
    <div class="mb-8 flex items-center justify-between">
      <div>
        <h1 class="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">{{ t('platformSettings') }}</h1>
        <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">{{ t('platformOverview') }}</p>
      </div>

      <div
        v-if="showSavedAlert"
        class="flex items-center gap-2 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 px-4 py-2 text-xs font-semibold text-emerald-800 shadow-sm animate-fade-in"
      >
        <Check :size="16" />
        {{ t('settingsSaved') }}
      </div>
    </div>

    <div class="max-w-2xl space-y-6">
      <!-- General section -->
      <div class="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 shadow-sm">
        <h2 class="mb-4 text-base font-bold text-slate-900 dark:text-white">{{ t('generalInfo') }}</h2>
        
        <div class="space-y-4">
          <div>
            <label class="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-300">{{ t('platformName') }}</label>
            <input
              v-model="platformName"
              type="text"
              class="w-full rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 px-3.5 py-2.5 text-sm text-slate-900 dark:text-slate-100 outline-none focus:bg-white dark:focus:bg-slate-600 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
            />
          </div>

          <div>
            <label class="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-300">{{ t('supportEmail') }}</label>
            <input
              v-model="supportEmail"
              type="email"
              class="w-full rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 px-3.5 py-2.5 text-sm text-slate-900 dark:text-slate-100 outline-none focus:bg-white dark:focus:bg-slate-600 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
            />
          </div>

          <div>
            <label class="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-300">{{ t('defaultCurrency') }}</label>
            <select
              v-model="currency"
              class="w-full rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 px-3.5 py-2.5 text-sm text-slate-900 dark:text-slate-100 outline-none focus:bg-white dark:focus:bg-slate-600 focus:border-amber-500"
            >
              <option value="USD ($)">USD ($)</option>
              <option value="EUR (€)">EUR (€)</option>
              <option value="KHR (៛)">KHR (៛)</option>
              <option value="GBP (£)">GBP (£)</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Toggles section -->
      <div class="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 space-y-4 shadow-sm">
        <h2 class="text-base font-bold text-slate-900 dark:text-white">{{ t('systemControls') }}</h2>

        <div class="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-700">
          <div>
            <p class="text-sm font-semibold text-slate-900 dark:text-white">{{ t('emailNotifications') }}</p>
            <p class="text-xs text-slate-500 dark:text-slate-400">{{ t('emailNotificationsDesc') }}</p>
          </div>
          <button
            type="button"
            @click="emailNotifications = !emailNotifications"
            class="h-6 w-11 rounded-full transition-colors relative"
            :class="emailNotifications ? 'bg-amber-500' : 'bg-slate-200 dark:bg-slate-600'"
          >
            <span
              class="block h-5 w-5 rounded-full bg-white dark:bg-slate-100 shadow-sm transition-transform transform"
              :class="emailNotifications ? 'translate-x-5' : 'translate-x-0.5'"
            />
          </button>
        </div>

        <div class="flex items-center justify-between py-2">
          <div>
            <p class="text-sm font-semibold text-slate-900 dark:text-white">{{ t('maintenanceMode') }}</p>
            <p class="text-xs text-slate-500 dark:text-slate-400">{{ t('maintenanceModeDesc') }}</p>
          </div>
          <button
            type="button"
            @click="maintenanceMode = !maintenanceMode"
            class="h-6 w-11 rounded-full transition-colors relative"
            :class="maintenanceMode ? 'bg-amber-500' : 'bg-slate-200 dark:bg-slate-600'"
          >
            <span
              class="block h-5 w-5 rounded-full bg-white dark:bg-slate-100 shadow-sm transition-transform transform"
              :class="maintenanceMode ? 'translate-x-5' : 'translate-x-0.5'"
            />
          </button>
        </div>
      </div>

      <!-- Action -->
      <div>
        <button
          type="button"
          @click="saveChanges"
          class="rounded-lg bg-amber-500 px-6 py-2.5 text-sm font-semibold text-slate-950 shadow-sm transition-all hover:bg-amber-600 hover:shadow"
        >
          {{ t('saveChanges') }}
        </button>
      </div>
    </div>
  </main>
</template>
