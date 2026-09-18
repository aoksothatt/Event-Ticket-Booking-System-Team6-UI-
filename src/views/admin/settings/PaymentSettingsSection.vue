<script setup>
import { reactive, watch } from "vue";
import { useI18n } from "vue-i18n";
import { useSettingsSection } from "@/composables/useSettingsSection.js";
import SettingInput from "@/components/common/SettingInput.vue";
import SettingSelect from "@/components/common/SettingSelect.vue";
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
  currency: "USD",
  bakong_enabled: true,
  timeout: 15,
  automatic_verification: true,
});

const currencies = [
  { value: "USD", label: t("currencyUSD") },
  { value: "KHR", label: t("currencyKHR") },
];

watch(
  () => props.settings,
  (s) => {
    if (!s) return;
    form.enabled = s["payment.enabled"] ?? true;
    form.currency = s["payment.currency"] ?? "USD";
    form.bakong_enabled = s["payment.bakong_enabled"] ?? true;
    form.timeout = s["payment.timeout"] ?? 15;
    form.automatic_verification = s["payment.automatic_verification"] ?? true;
  },
  { immediate: true }
);

function validate() {
  const errs = {};
  const timeout = Number(form.timeout);
  if (!Number.isFinite(timeout) || timeout < 1) {
    errs["payment.timeout"] = t("mustBePositive");
  }
  return errs;
}

async function handleSave() {
  errors.value = validate();
  if (Object.keys(errors.value).length) return;
  await save({
    "payment.enabled": form.enabled,
    "payment.currency": form.currency,
    "payment.bakong_enabled": form.bakong_enabled,
    "payment.timeout": Number(form.timeout),
    "payment.automatic_verification": form.automatic_verification,
  });
}
</script>

<template>
  <div class="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 shadow-sm">
    <h2 class="mb-1 text-base font-bold text-slate-900 dark:text-white">{{ t('settingsPaymentSection') }}</h2>
    <p class="mb-4 text-sm text-slate-500 dark:text-slate-400">{{ t('settingsPaymentHint') }}</p>

    <div class="divide-y divide-slate-100 dark:divide-slate-700">
      <SettingToggle
        v-model="form.enabled"
        :label="t('settingsPaymentEnabled')"
        :description="t('settingsPaymentEnabledDesc')"
      />
      <SettingToggle
        v-model="form.bakong_enabled"
        :label="t('settingsBakongEnabled')"
        :description="t('settingsBakongEnabledDesc')"
      />
      <SettingToggle
        v-model="form.automatic_verification"
        :label="t('settingsAutomaticVerification')"
        :description="t('settingsAutomaticVerificationDesc')"
      />
    </div>

    <div class="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2">
      <SettingSelect
        id="payment_currency"
        v-model="form.currency"
        :label="t('settingsPaymentCurrency')"
        :options="currencies"
      />
      <SettingInput
        id="payment_timeout"
        v-model="form.timeout"
        type="number"
        :label="t('settingsPaymentTimeout')"
        :hint="t('settingsPaymentTimeoutHint')"
        min="1"
        :error="fieldError('payment.timeout')"
      />
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