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
const { saving, errors, save, fieldError } = useSettingsSection(emit);

const form = reactive({
  maintenance_mode: false,
  maintenance_message: "",
});

watch(
  () => props.settings,
  (s) => {
    if (!s) return;
    form.maintenance_mode = s["system.maintenance_mode"] ?? false;
    form.maintenance_message = s["system.maintenance_message"] ?? "";
  },
  { immediate: true }
);

function validate() {
  const errs = {};
  if (form.maintenance_mode && !form.maintenance_message.trim()) {
    errs["system.maintenance_message"] = t("settingsMaintenanceMessageRequired");
  }
  return errs;
}

async function handleSave() {
  errors.value = validate();
  if (Object.keys(errors.value).length) return;
  await save({
    "system.maintenance_mode": form.maintenance_mode,
    "system.maintenance_message": form.maintenance_message.trim(),
  });
}
</script>

<template>
  <div class="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 shadow-sm">
    <h2 class="mb-1 text-base font-bold text-slate-900 dark:text-white">{{ t('settingsSystemSection') }}</h2>
    <p class="mb-4 text-sm text-slate-500 dark:text-slate-400">{{ t('settingsSystemHint') }}</p>

    <div class="divide-y divide-slate-100 dark:divide-slate-700">
      <SettingToggle
        v-model="form.maintenance_mode"
        :label="t('maintenanceMode')"
        :description="t('maintenanceModeDesc')"
      />
    </div>

    <div class="mt-6">
      <label for="maintenance_message" class="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-300">
        {{ t('settingsMaintenanceMessage') }}
      </label>
      <textarea
        id="maintenance_message"
        v-model="form.maintenance_message"
        rows="3"
        :disabled="!form.maintenance_mode"
        :class="fieldError('system.maintenance_message')
          ? 'border-rose-400 focus:border-rose-400 focus:ring-rose-500/20'
          : 'border-slate-200 dark:border-slate-600'"
        class="w-full rounded-lg border bg-slate-50 dark:bg-slate-700 px-3.5 py-2.5 text-sm text-slate-900 dark:text-slate-100 outline-none transition-colors focus:bg-white dark:focus:bg-slate-600 focus:ring-2 disabled:cursor-not-allowed disabled:opacity-60"
        :placeholder="t('settingsMaintenanceMessagePlaceholder')"
      />
      <p v-if="fieldError('system.maintenance_message')" class="mt-1 text-xs text-rose-500">
        {{ fieldError('system.maintenance_message') }}
      </p>
      <p v-else class="mt-1 text-xs text-slate-400 dark:text-slate-500">{{ t('settingsMaintenanceMessageHint') }}</p>
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