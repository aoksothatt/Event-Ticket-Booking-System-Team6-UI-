<script setup>
import { reactive, watch } from "vue";
import { useI18n } from "vue-i18n";
import { useSettingsSection } from "@/composables/useSettingsSection.js";
import SettingSelect from "@/components/common/SettingSelect.vue";
import SettingToggle from "@/components/common/SettingToggle.vue";
import { Loader2 } from "lucide-vue-next";

const props = defineProps({
  settings: { type: Object, required: true },
});
const emit = defineEmits(["saved"]);

const { t } = useI18n();
const { saving, save } = useSettingsSection(emit);

const form = reactive({
  registration_enabled: true,
  email_verification: true,
  google_login: true,
  profile_editing: true,
  account_deletion: false,
  default_role: "customer",
});

const roles = [
  { value: "customer", label: t("customer") },
  { value: "organizer", label: t("organizer") },
];

watch(
  () => props.settings,
  (s) => {
    if (!s) return;
    form.registration_enabled = s["user.registration_enabled"] ?? true;
    form.email_verification = s["user.email_verification"] ?? true;
    form.google_login = s["user.google_login"] ?? true;
    form.profile_editing = s["user.profile_editing"] ?? true;
    form.account_deletion = s["user.account_deletion"] ?? false;
    form.default_role = s["user.default_role"] ?? "customer";
  },
  { immediate: true }
);

async function handleSave() {
  await save({
    "user.registration_enabled": form.registration_enabled,
    "user.email_verification": form.email_verification,
    "user.google_login": form.google_login,
    "user.profile_editing": form.profile_editing,
    "user.account_deletion": form.account_deletion,
    "user.default_role": form.default_role,
  });
}
</script>

<template>
  <div class="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 shadow-sm">
    <h2 class="mb-1 text-base font-bold text-slate-900 dark:text-white">{{ t('settingsUsersSection') }}</h2>
    <p class="mb-4 text-sm text-slate-500 dark:text-slate-400">{{ t('settingsUsersHint') }}</p>

    <div class="divide-y divide-slate-100 dark:divide-slate-700">
      <SettingToggle
        v-model="form.registration_enabled"
        :label="t('settingsRegistrationEnabled')"
        :description="t('settingsRegistrationEnabledDesc')"
      />
      <SettingToggle
        v-model="form.email_verification"
        :label="t('settingsEmailVerification')"
        :description="t('settingsEmailVerificationDesc')"
      />
      <SettingToggle
        v-model="form.google_login"
        :label="t('settingsGoogleLogin')"
        :description="t('settingsGoogleLoginDesc')"
      />
      <SettingToggle
        v-model="form.profile_editing"
        :label="t('settingsProfileEditing')"
        :description="t('settingsProfileEditingDesc')"
      />
      <SettingToggle
        v-model="form.account_deletion"
        :label="t('settingsAccountDeletion')"
        :description="t('settingsAccountDeletionDesc')"
      />
    </div>

    <div class="mt-6 grid max-w-xs grid-cols-1 gap-5">
      <SettingSelect
        id="default_role"
        v-model="form.default_role"
        :label="t('settingsDefaultRole')"
        :hint="t('settingsDefaultRoleHint')"
        :options="roles"
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