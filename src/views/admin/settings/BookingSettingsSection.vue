<script setup>
import { reactive, watch } from "vue";
import { useI18n } from "vue-i18n";
import { useSettingsSection } from "@/composables/useSettingsSection.js";
import SettingInput from "@/components/common/SettingInput.vue";
import SettingToggle from "@/components/common/SettingToggle.vue";
import { Loader2 } from "lucide-vue-next";

const props = defineProps({
  settings: { type: Object, required: true },
});
const emit = defineEmits(["saved"]);

const { t } = useI18n();
const { saving, errors, save, fieldError } = useSettingsSection(emit);

const form = reactive({
  enabled: true,
  min_tickets: 1,
  max_tickets: 10,
  cancellation_enabled: true,
  cancellation_deadline: 24,
  auto_expire: true,
  expiration_minutes: 15,
  require_phone: false,
  require_email_verification: true,
});

watch(
  () => props.settings,
  (s) => {
    if (!s) return;
    form.enabled = s["booking.enabled"] ?? true;
    form.min_tickets = s["booking.min_tickets"] ?? 1;
    form.max_tickets = s["booking.max_tickets"] ?? 10;
    form.cancellation_enabled = s["booking.cancellation_enabled"] ?? true;
    form.cancellation_deadline = s["booking.cancellation_deadline"] ?? 24;
    form.auto_expire = s["booking.auto_expire"] ?? true;
    form.expiration_minutes = s["booking.expiration_minutes"] ?? 15;
    form.require_phone = s["booking.require_phone"] ?? false;
    form.require_email_verification = s["booking.require_email_verification"] ?? true;
  },
  { immediate: true }
);

function validate() {
  const errs = {};
  const min = Number(form.min_tickets);
  const max = Number(form.max_tickets);
  if (!Number.isFinite(min) || min < 1) {
    errs["booking.min_tickets"] = t("mustBePositive");
  }
  if (!Number.isFinite(max) || max < 1) {
    errs["booking.max_tickets"] = t("mustBePositive");
  }
  if (!errs["booking.min_tickets"] && !errs["booking.max_tickets"] && max < min) {
    errs["booking.max_tickets"] = t("maxTicketsGreaterThanMin", { min });
  }
  const deadline = Number(form.cancellation_deadline);
  if (!Number.isFinite(deadline) || deadline < 0) {
    errs["booking.cancellation_deadline"] = t("mustBeNonNegative");
  }
  const expiry = Number(form.expiration_minutes);
  if (!Number.isFinite(expiry) || expiry < 1) {
    errs["booking.expiration_minutes"] = t("mustBePositive");
  }
  return errs;
}

async function handleSave() {
  errors.value = validate();
  if (Object.keys(errors.value).length) return;
  await save({
    "booking.enabled": form.enabled,
    "booking.min_tickets": Number(form.min_tickets),
    "booking.max_tickets": Number(form.max_tickets),
    "booking.cancellation_enabled": form.cancellation_enabled,
    "booking.cancellation_deadline": Number(form.cancellation_deadline),
    "booking.auto_expire": form.auto_expire,
    "booking.expiration_minutes": Number(form.expiration_minutes),
    "booking.require_phone": form.require_phone,
    "booking.require_email_verification": form.require_email_verification,
  });
}
</script>

<template>
  <div class="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 shadow-sm">
    <h2 class="mb-1 text-base font-bold text-slate-900 dark:text-white">{{ t('settingsBookingSection') }}</h2>
    <p class="mb-4 text-sm text-slate-500 dark:text-slate-400">{{ t('settingsBookingHint') }}</p>

    <div class="divide-y divide-slate-100 dark:divide-slate-700">
      <SettingToggle
        v-model="form.enabled"
        :label="t('settingsBookingEnabled')"
        :description="t('settingsBookingEnabledDesc')"
      />
      <SettingToggle
        v-model="form.require_email_verification"
        :label="t('settingsRequireEmailVerification')"
        :description="t('settingsRequireEmailVerificationDesc')"
      />
      <SettingToggle
        v-model="form.require_phone"
        :label="t('settingsRequirePhone')"
        :description="t('settingsRequirePhoneDesc')"
      />
    </div>

    <h3 class="mt-6 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{{ t('settingsOrderLimits') }}</h3>
    <div class="mt-3 grid grid-cols-1 gap-5 sm:grid-cols-2">
      <SettingInput
        id="min_tickets"
        v-model="form.min_tickets"
        type="number"
        :label="t('settingsMinTickets')"
        min="1"
        :error="fieldError('booking.min_tickets')"
      />
      <SettingInput
        id="max_tickets"
        v-model="form.max_tickets"
        type="number"
        :label="t('settingsMaxTickets')"
        min="1"
        :error="fieldError('booking.max_tickets')"
      />
    </div>

    <h3 class="mt-6 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{{ t('settingsPendingExpiry') }}</h3>
    <div class="mt-3 divide-y divide-slate-100 dark:divide-slate-700">
      <SettingToggle
        v-model="form.auto_expire"
        :label="t('settingsAutoExpire')"
        :description="t('settingsAutoExpireDesc')"
      />
      <div class="pt-4">
        <SettingInput
          id="expiration_minutes"
          v-model="form.expiration_minutes"
          type="number"
          :label="t('settingsExpirationMinutes')"
          min="1"
          :disabled="!form.auto_expire"
          :error="fieldError('booking.expiration_minutes')"
        />
      </div>
    </div>

    <h3 class="mt-6 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{{ t('settingsCancellation') }}</h3>
    <div class="mt-3 divide-y divide-slate-100 dark:divide-slate-700">
      <SettingToggle
        v-model="form.cancellation_enabled"
        :label="t('settingsCancellationEnabled')"
        :description="t('settingsCancellationEnabledDesc')"
      />
      <div class="pt-4">
        <SettingInput
          id="cancellation_deadline"
          v-model="form.cancellation_deadline"
          type="number"
          :label="t('settingsCancellationDeadline')"
          :hint="t('settingsCancellationDeadlineHint')"
          min="0"
          :disabled="!form.cancellation_enabled"
          :error="fieldError('booking.cancellation_deadline')"
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