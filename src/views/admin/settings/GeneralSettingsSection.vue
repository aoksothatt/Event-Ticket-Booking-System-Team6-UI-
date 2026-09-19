<script setup>
import { reactive, watch } from "vue";
import { useI18n } from "vue-i18n";
import { useSettingsSection } from "@/composables/useSettingsSection.js";
import SettingInput from "@/components/common/SettingInput.vue";
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
});

watch(
  () => props.settings,
  (s) => {
    if (!s) return;
    form.platform_name = s["general.platform_name"] ?? "";
    form.platform_description = s["general.platform_description"] ?? "";
  },
  { immediate: true }
);

function validate() {
  const errs = {};
  if (!form.platform_name?.trim()) {
    errs["general.platform_name"] = t("requiredField");
  }
  return errs;
}

async function handleSave() {
  errors.value = validate();
  if (Object.keys(errors.value).length) return;
  await save({
    "general.platform_name": form.platform_name.trim(),
    "general.platform_description": form.platform_description.trim(),
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