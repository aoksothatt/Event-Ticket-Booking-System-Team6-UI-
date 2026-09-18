<script setup>
import { reactive, watch } from "vue";
import { useI18n } from "vue-i18n";
import { useSettingsSection } from "@/composables/useSettingsSection.js";
import SettingInput from "@/components/common/SettingInput.vue";
import SettingSelect from "@/components/common/SettingSelect.vue";
import { Loader2 } from "lucide-vue-next";

const props = defineProps({
  settings: { type: Object, required: true },
});
const emit = defineEmits(["saved"]);

const { t } = useI18n();
const { saving, errors, save, fieldError } = useSettingsSection(emit);

const form = reactive({
  platform_name: "",
  platform_description: "",
  support_email: "",
  support_phone: "",
  default_currency: "USD",
  timezone: "Asia/Phnom_Penh",
  language: "en",
});

const currencies = [
  { value: "USD", label: t("currencyUSD") },
  { value: "EUR", label: t("currencyEUR") },
  { value: "KHR", label: t("currencyKHR") },
  { value: "GBP", label: t("currencyGBP") },
];
const timezones = [
  "Asia/Phnom_Penh",
  "Asia/Bangkok",
  "Asia/Singapore",
  "Asia/Kuala_Lumpur",
  "UTC",
  "Europe/London",
  "America/New_York",
];
const languages = [
  { value: "en", label: t("english") },
  { value: "km", label: t("khmer") },
];

watch(
  () => props.settings,
  (s) => {
    if (!s) return;
    form.platform_name = s["general.platform_name"] ?? "";
    form.platform_description = s["general.platform_description"] ?? "";
    form.support_email = s["general.support_email"] ?? "";
    form.support_phone = s["general.support_phone"] ?? "";
    form.default_currency = s["general.default_currency"] ?? "USD";
    form.timezone = s["general.timezone"] ?? "Asia/Phnom_Penh";
    form.language = s["general.language"] ?? "en";
  },
  { immediate: true }
);

function validate() {
  const errs = {};
  if (!form.platform_name?.trim()) {
    errs["general.platform_name"] = t("requiredField");
  }
  if (!form.support_email?.trim()) {
    errs["general.support_email"] = t("requiredField");
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.support_email.trim())) {
    errs["general.support_email"] = t("validEmail");
  }
  return errs;
}

async function handleSave() {
  errors.value = validate();
  if (Object.keys(errors.value).length) return;
  await save({
    "general.platform_name": form.platform_name.trim(),
    "general.platform_description": form.platform_description.trim(),
    "general.support_email": form.support_email.trim(),
    "general.support_phone": form.support_phone.trim(),
    "general.default_currency": form.default_currency,
    "general.timezone": form.timezone,
    "general.language": form.language,
  });
}
</script>

<template>
  <div class="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 shadow-sm">
    <h2 class="mb-1 text-base font-bold text-slate-900 dark:text-white">{{ t('settingsGeneralSection') }}</h2>
    <p class="mb-6 text-sm text-slate-500 dark:text-slate-400">{{ t('settingsGeneralHint') }}</p>

    <div class="grid grid-cols-1 gap-5 sm:grid-cols-2">
      <SettingInput
        id="platform_name"
        v-model="form.platform_name"
        :label="t('platformName')"
        :hint="t('settingsPlatformNameHint')"
        :error="fieldError('general.platform_name')"
      />
      <SettingInput
        id="support_email"
        v-model="form.support_email"
        type="email"
        :label="t('supportEmail')"
        :error="fieldError('general.support_email')"
      />
      <SettingInput
        id="support_phone"
        v-model="form.support_phone"
        type="tel"
        :label="t('settingsSupportPhone')"
        :placeholder="t('phonePlaceholder')"
      />
      <SettingSelect
        id="default_currency"
        v-model="form.default_currency"
        :label="t('defaultCurrency')"
        :options="currencies"
      />
      <SettingSelect
        id="timezone"
        v-model="form.timezone"
        :label="t('settingsTimezone')"
        :options="timezones"
      />
      <SettingSelect
        id="language"
        v-model="form.language"
        :label="t('settingsLanguage')"
        :options="languages"
      />
    </div>

    <div class="mt-5">
      <SettingInput
        id="platform_description"
        v-model="form.platform_description"
        :label="t('settingsPlatformDescription')"
        :hint="t('settingsPlatformDescriptionHint')"
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