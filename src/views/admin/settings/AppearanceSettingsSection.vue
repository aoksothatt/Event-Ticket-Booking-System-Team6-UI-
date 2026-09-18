<script setup>
import { reactive, watch, computed, onBeforeUnmount } from "vue";
import { useI18n } from "vue-i18n";
import { useSettingsSection } from "@/composables/useSettingsSection.js";
import { useSettingsStore } from "@/stores/settings.js";
import SettingInput from "@/components/common/SettingInput.vue";
import SettingSelect from "@/components/common/SettingSelect.vue";
import { Loader2 } from "lucide-vue-next";

const props = defineProps({
  settings: { type: Object, required: true },
});
const emit = defineEmits(["saved"]);

const { t } = useI18n();
const { saving, errors, save, fieldError } = useSettingsSection(emit);
const platformSettings = useSettingsStore();

const form = reactive({
  logo: "",
  favicon: "",
  primary_color: "#f59e0b",
  secondary_color: "#0f172a",
  theme: "system",
  tagline: "",
  footer_copyright: "",
});

const themes = [
  { value: "light", label: t("themeLight") },
  { value: "dark", label: t("themeDark") },
  { value: "system", label: t("themeSystem") },
];

const HEX_RE = /^#([0-9a-fA-F]{6})$/;

const primaryColorValid = computed(() => HEX_RE.test(form.primary_color));
const secondaryColorValid = computed(() => HEX_RE.test(form.secondary_color));

watch(
  () => props.settings,
  (s) => {
    if (!s) return;
    form.logo = s["appearance.logo"] ?? "";
    form.favicon = s["appearance.favicon"] ?? "";
    form.primary_color = s["appearance.primary_color"] ?? "#f59e0b";
    form.secondary_color = s["appearance.secondary_color"] ?? "#0f172a";
    form.theme = s["appearance.theme"] ?? "system";
    form.tagline = s["appearance.tagline"] ?? "";
    form.footer_copyright = s["appearance.footer_copyright"] ?? "";
  },
  { immediate: true }
);

function validate() {
  const errs = {};
  if (!HEX_RE.test(form.primary_color.trim())) {
    errs["appearance.primary_color"] = t("invalidHexColor");
  }
  if (!HEX_RE.test(form.secondary_color.trim())) {
    errs["appearance.secondary_color"] = t("invalidHexColor");
  }
  return errs;
}

function hexToInput(raw) {
  return HEX_RE.test(raw.trim()) ? raw : "#f59e0b";
}

// Live preview: while the admin picks/edits the primary color the whole app
// re-themes immediately. Leaving the section (or saving) re-applies the saved
// value so a discarded preview never sticks.
let previewTimer = null;
watch(
  () => form.primary_color,
  (hex) => {
    clearTimeout(previewTimer);
    previewTimer = setTimeout(() => {
      if (hex && HEX_RE.test(hex.trim())) platformSettings.previewColor(hex.trim());
    }, 150);
  }
);

onBeforeUnmount(() => {
  clearTimeout(previewTimer);
  platformSettings.applyBranding();
});

async function handleSave() {
  errors.value = validate();
  if (Object.keys(errors.value).length) return;
  const ok = await save({
    "appearance.logo": form.logo.trim(),
    "appearance.favicon": form.favicon.trim(),
    "appearance.primary_color": form.primary_color.trim(),
    "appearance.secondary_color": form.secondary_color.trim(),
    "appearance.theme": form.theme,
    "appearance.tagline": form.tagline.trim(),
    "appearance.footer_copyright": form.footer_copyright.trim(),
  });
  // Saved value comes from the backend — refresh the store so the persisted
  // color (not the preview) becomes the active theme across every page.
  if (ok) await platformSettings.load(true);
}
</script>

<template>
  <div class="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 shadow-sm">
    <h2 class="mb-1 text-base font-bold text-slate-900 dark:text-white">{{ t('settingsAppearanceSection') }}</h2>
    <p class="mb-6 text-sm text-slate-500 dark:text-slate-400">{{ t('settingsAppearanceHint') }}</p>

    <div class="grid grid-cols-1 gap-5 sm:grid-cols-2">
      <SettingInput
        id="logo"
        v-model="form.logo"
        type="url"
        :label="t('settingsLogo')"
        :hint="t('settingsAssetHint')"
      />
      <SettingInput
        id="favicon"
        v-model="form.favicon"
        type="url"
        :label="t('settingsFavicon')"
        :hint="t('settingsAssetHint')"
      />
    </div>

    <div class="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2">
      <div>
        <label class="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-300">{{ t('settingsPrimaryColor') }}</label>
        <div class="flex items-center gap-3">
          <input
            type="color"
            :value="hexToInput(form.primary_color)"
            @input="form.primary_color = $event.target.value"
            class="h-10 w-14 shrink-0 cursor-pointer rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 p-1 dark:bg-slate-700"
          />
          <div class="flex-1">
            <input
              v-model="form.primary_color"
              type="text"
              spellcheck="false"
              :class="primaryColorValid
                ? 'border-slate-200 dark:border-slate-600'
                : 'border-rose-400 focus:border-rose-400 focus:ring-rose-500/20'"
              class="w-full rounded-lg border bg-slate-50 dark:bg-slate-700 px-3.5 py-2.5 font-mono text-sm text-slate-900 dark:text-slate-100 outline-none focus:bg-white dark:focus:bg-slate-600 focus:ring-2"
            />
            <p v-if="fieldError('appearance.primary_color')" class="mt-1 text-xs text-rose-500">
              {{ fieldError('appearance.primary_color') }}
            </p>
          </div>
        </div>
      </div>

      <div>
        <label class="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-300">{{ t('settingsSecondaryColor') }}</label>
        <div class="flex items-center gap-3">
          <input
            type="color"
            :value="hexToInput(form.secondary_color)"
            @input="form.secondary_color = $event.target.value"
            class="h-10 w-14 shrink-0 cursor-pointer rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 p-1 dark:bg-slate-700"
          />
          <div class="flex-1">
            <input
              v-model="form.secondary_color"
              type="text"
              spellcheck="false"
              :class="secondaryColorValid
                ? 'border-slate-200 dark:border-slate-600'
                : 'border-rose-400 focus:border-rose-400 focus:ring-rose-500/20'"
              class="w-full rounded-lg border bg-slate-50 dark:bg-slate-700 px-3.5 py-2.5 font-mono text-sm text-slate-900 dark:text-slate-100 outline-none focus:bg-white dark:focus:bg-slate-600 focus:ring-2"
            />
            <p v-if="fieldError('appearance.secondary_color')" class="mt-1 text-xs text-rose-500">
              {{ fieldError('appearance.secondary_color') }}
            </p>
          </div>
        </div>
      </div>
    </div>

    <div class="mt-5">
      <label class="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-300">{{ t('settingsTheme') }}</label>
      <div class="flex flex-wrap gap-2">
        <button
          v-for="th in themes"
          :key="th.value"
          type="button"
          @click="form.theme = th.value"
          class="rounded-lg border px-4 py-2 text-sm font-semibold transition-colors"
          :class="form.theme === th.value
            ? 'border-primary bg-primary/10 text-primary-accent'
            : 'border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:border-primary'"
        >
          {{ th.label }}
        </button>
      </div>
      <p v-if="fieldError('appearance.theme')" class="mt-1 text-xs text-rose-500">{{ fieldError('appearance.theme') }}</p>
    </div>

    <div class="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2">
      <SettingInput
        id="tagline"
        v-model="form.tagline"
        :label="t('settingsTagline')"
      />
      <SettingInput
        id="footer_copyright"
        v-model="form.footer_copyright"
        :label="t('settingsFooterCopyright')"
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