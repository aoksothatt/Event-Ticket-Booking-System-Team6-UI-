<script setup>
import { reactive, watch } from "vue";
import { useI18n } from "vue-i18n";
import { useSettingsSection } from "@/composables/useSettingsSection.js";
import SettingToggle from "@/components/common/SettingToggle.vue";
import { Loader2 } from "lucide-vue-next";

const props = defineProps({
  settings: { type: Object, required: true },
});
const emit = defineEmits(["saved"]);

const { t } = useI18n();
const { saving, save } = useSettingsSection(emit);

const form = reactive({
  email_enabled: true,
  customer_booking_confirmation: true,
  customer_payment_successful: true,
  customer_payment_failed: true,
  customer_ticket_issued: true,
  customer_booking_cancelled: true,
  customer_event_reminder: true,
  organizer_new_booking: true,
  organizer_payment_received: true,
  organizer_event_approved: true,
  organizer_event_cancelled: true,
});

const customerTriggers = [
  { key: "customer_booking_confirmation", label: t("settingsNotifBookingConfirmation"), desc: t("settingsNotifBookingConfirmationDesc") },
  { key: "customer_payment_successful", label: t("settingsNotifPaymentSuccessful"), desc: t("settingsNotifPaymentSuccessfulDesc") },
  { key: "customer_payment_failed", label: t("settingsNotifPaymentFailed"), desc: t("settingsNotifPaymentFailedDesc") },
  { key: "customer_ticket_issued", label: t("settingsNotifTicketIssued"), desc: t("settingsNotifTicketIssuedDesc") },
  { key: "customer_booking_cancelled", label: t("settingsNotifBookingCancelled"), desc: t("settingsNotifBookingCancelledDesc") },
  { key: "customer_event_reminder", label: t("settingsNotifEventReminder"), desc: t("settingsNotifEventReminderDesc") },
];

const organizerTriggers = [
  { key: "organizer_new_booking", label: t("settingsNotifNewBooking"), desc: t("settingsNotifNewBookingDesc") },
  { key: "organizer_payment_received", label: t("settingsNotifPaymentReceived"), desc: t("settingsNotifPaymentReceivedDesc") },
  { key: "organizer_event_approved", label: t("settingsNotifEventApproved"), desc: t("settingsNotifEventApprovedDesc") },
  { key: "organizer_event_cancelled", label: t("settingsNotifEventCancelled"), desc: t("settingsNotifEventCancelledDesc") },
];

watch(
  () => props.settings,
  (s) => {
    if (!s) return;
    form.email_enabled = s["notification.email_enabled"] ?? true;
    customerTriggers.forEach((tr) => {
      form[tr.key] = s[`notification.${tr.key}`] ?? true;
    });
    organizerTriggers.forEach((tr) => {
      form[tr.key] = s[`notification.${tr.key}`] ?? true;
    });
  },
  { immediate: true }
);

function buildPayload() {
  const payload = { "notification.email_enabled": form.email_enabled };
  [...customerTriggers, ...organizerTriggers].forEach((tr) => {
    payload[`notification.${tr.key}`] = form[tr.key];
  });
  return payload;
}

async function handleSave() {
  await save(buildPayload());
}
</script>

<template>
  <div class="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 shadow-sm">
    <h2 class="mb-1 text-base font-bold text-slate-900 dark:text-white">{{ t('settingsNotificationsSection') }}</h2>
    <p class="mb-4 text-sm text-slate-500 dark:text-slate-400">{{ t('settingsNotificationsHint') }}</p>

    <div class="divide-y divide-slate-100 dark:divide-slate-700">
      <SettingToggle
        v-model="form.email_enabled"
        :label="t('emailNotifications')"
        :description="t('settingsNotifMasterDesc')"
      />
    </div>

    <div class="mt-6">
      <h3 class="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{{ t('settingsGroupCustomer') }}</h3>
      <div class="mt-2 divide-y divide-slate-100 dark:divide-slate-700 opacity-90">
        <SettingToggle
          v-for="tr in customerTriggers"
          :key="tr.key"
          v-model="form[tr.key]"
          :label="tr.label"
          :description="tr.desc"
          :disabled="!form.email_enabled"
        />
      </div>
    </div>

    <div class="mt-6">
      <h3 class="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{{ t('settingsGroupOrganizer') }}</h3>
      <div class="mt-2 divide-y divide-slate-100 dark:divide-slate-700 opacity-90">
        <SettingToggle
          v-for="tr in organizerTriggers"
          :key="tr.key"
          v-model="form[tr.key]"
          :label="tr.label"
          :description="tr.desc"
          :disabled="!form.email_enabled"
        />
      </div>
    </div>

    <div class="mt-6 flex items-center justify-between border-t border-slate-100 pt-5 dark:border-slate-700">
      <p class="text-xs text-slate-400 dark:text-slate-500">{{ t('settingsAppliedToWholePlatform') }}</p>
      <button
        type="button"
        @click="handleSave"
        :disabled="saving"
        class="flex items-center gap-2 rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-primary-contrast shadow-sm transition-all hover:bg-primary-hover hover:shadow disabled:cursor-not-allowed disabled:opacity-60"
      >
        <Loader2 v-if="saving" :size="15" class="animate-spin" />
        {{ saving ? t("saving") : t("saveChanges") }}
      </button>
    </div>
  </div>
</template>