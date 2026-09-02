<script setup>
import { ref } from "vue";
import { Check, ShieldCheck, Bell, Server, Globe, Mail } from "lucide-vue-next";

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
  <main class="min-h-screen flex-1 bg-[#0B0B0C] px-8 py-8 text-white">
    <div class="mb-8 flex items-center justify-between">
      <div>
        <h1 class="text-3xl font-bold tracking-tight">Settings</h1>
        <p class="mt-1 text-sm text-white/50">Platform-wide system configuration and preferences.</p>
      </div>

      <div
        v-if="showSavedAlert"
        class="flex items-center gap-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 px-4 py-2 text-xs font-medium text-emerald-400 animate-fade-in"
      >
        <Check :size="16" />
        Settings saved successfully!
      </div>
    </div>

    <div class="max-w-2xl space-y-6">
      <!-- General section -->
      <div class="rounded-xl border border-white/10 bg-[#141416] p-6">
        <h2 class="mb-4 text-base font-semibold">General Information</h2>
        
        <div class="space-y-4">
          <div>
            <label class="mb-2 block text-xs font-medium text-white/50">Platform Name</label>
            <input
              v-model="platformName"
              type="text"
              class="w-full rounded-lg border border-white/10 bg-[#111113] px-3.5 py-2.5 text-sm text-white outline-none focus:border-amber-500/60"
            />
          </div>

          <div>
            <label class="mb-2 block text-xs font-medium text-white/50">Support Email</label>
            <div class="relative">
              <input
                v-model="supportEmail"
                type="email"
                class="w-full rounded-lg border border-white/10 bg-[#111113] px-3.5 py-2.5 text-sm text-white outline-none focus:border-amber-500/60"
              />
            </div>
          </div>

          <div>
            <label class="mb-2 block text-xs font-medium text-white/50">Default Currency</label>
            <select
              v-model="currency"
              class="w-full rounded-lg border border-white/10 bg-[#111113] px-3.5 py-2.5 text-sm text-white outline-none focus:border-amber-500/60"
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
      <div class="rounded-xl border border-white/10 bg-[#141416] p-6 space-y-4">
        <h2 class="text-base font-semibold">System & Notification Controls</h2>

        <div class="flex items-center justify-between py-2 border-b border-white/5">
          <div>
            <p class="text-sm font-medium">Email Notifications</p>
            <p class="text-xs text-white/40">Send order confirmations and payout alerts to organizers & buyers.</p>
          </div>
          <button
            type="button"
            @click="emailNotifications = !emailNotifications"
            class="h-6 w-11 rounded-full transition-colors relative"
            :class="emailNotifications ? 'bg-amber-500' : 'bg-white/10'"
          >
            <span
              class="block h-5 w-5 rounded-full bg-white transition-transform transform"
              :class="emailNotifications ? 'translate-x-5' : 'translate-x-0.5'"
            />
          </button>
        </div>

        <div class="flex items-center justify-between py-2">
          <div>
            <p class="text-sm font-medium">Maintenance Mode</p>
            <p class="text-xs text-white/40">Take the storefront offline for regular visitors while maintenance is ongoing.</p>
          </div>
          <button
            type="button"
            @click="maintenanceMode = !maintenanceMode"
            class="h-6 w-11 rounded-full transition-colors relative"
            :class="maintenanceMode ? 'bg-amber-500' : 'bg-white/10'"
          >
            <span
              class="block h-5 w-5 rounded-full bg-white transition-transform transform"
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
          class="rounded-lg bg-amber-500 px-6 py-2.5 text-sm font-semibold text-black transition-opacity hover:opacity-90 shadow-md shadow-amber-500/10"
        >
          Save Changes
        </button>
      </div>
    </div>
  </main>
</template>
