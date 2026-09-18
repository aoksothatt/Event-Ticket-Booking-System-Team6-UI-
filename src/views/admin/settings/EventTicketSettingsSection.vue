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
  organizer_create_enabled: true,
  admin_approval_required: false,
  allow_edit_after_publish: true,
  allow_cancellation: true,
  auto_handle_past: true,
  qr_enabled: true,
  allow_download: true,
  allow_printing: true,
  auto_mark_used: true,
});

const eventControls = [
  { key: "organizer_create_enabled", label: t("settingsOrganizerCreate"), desc: t("settingsOrganizerCreateDesc") },
  { key: "admin_approval_required", label: t("settingsAdminApproval"), desc: t("settingsAdminApprovalDesc") },
  { key: "allow_edit_after_publish", label: t("settingsEditAfterPublish"), desc: t("settingsEditAfterPublishDesc") },
  { key: "allow_cancellation", label: t("settingsEventCancellation"), desc: t("settingsEventCancellationDesc") },
  { key: "auto_handle_past", label: t("settingsAutoHandlePast"), desc: t("settingsAutoHandlePastDesc") },
];

const ticketControls = [
  { key: "qr_enabled", label: t("settingsQREnabled"), desc: t("settingsQREnabledDesc") },
  { key: "allow_download", label: t("settingsTicketDownload"), desc: t("settingsTicketDownloadDesc") },
  { key: "allow_printing", label: t("settingsTicketPrinting"), desc: t("settingsTicketPrintingDesc") },
  { key: "auto_mark_used", label: t("settingsAutoMarkUsed"), desc: t("settingsAutoMarkUsedDesc") },
];

watch(
  () => props.settings,
  (s) => {
    if (!s) return;
    eventControls.forEach((c) => {
      form[c.key] = s[`event.${c.key}`] ?? true;
    });
    ticketControls.forEach((c) => {
      form[c.key] = s[`ticket.${c.key}`] ?? true;
    });
  },
  { immediate: true }
);

async function handleSave() {
  const payload = {};
  eventControls.forEach((c) => {
    payload[`event.${c.key}`] = form[c.key];
  });
  ticketControls.forEach((c) => {
    payload[`ticket.${c.key}`] = form[c.key];
  });
  await save(payload);
}
</script>

<template>
  <div class="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 shadow-sm">
    <h2 class="mb-1 text-base font-bold text-slate-900 dark:text-white">{{ t('settingsEventTicketSection') }}</h2>
    <p class="mb-4 text-sm text-slate-500 dark:text-slate-400">{{ t('settingsEventTicketHint') }}</p>

    <div>
      <h3 class="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{{ t('settingsGroupEvent') }}</h3>
      <div class="mt-2 divide-y divide-slate-100 dark:divide-slate-700">
        <SettingToggle
          v-for="c in eventControls"
          :key="c.key"
          v-model="form[c.key]"
          :label="c.label"
          :description="c.desc"
        />
      </div>
    </div>

    <div class="mt-6">
      <h3 class="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{{ t('settingsGroupTicket') }}</h3>
      <div class="mt-2 divide-y divide-slate-100 dark:divide-slate-700">
        <SettingToggle
          v-for="c in ticketControls"
          :key="c.key"
          v-model="form[c.key]"
          :label="c.label"
          :description="c.desc"
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