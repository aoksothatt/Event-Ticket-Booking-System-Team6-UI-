<script setup>
import { reactive, watch, computed, onBeforeUnmount, ref } from "vue";
import { useI18n } from "vue-i18n";
import { useSettingsSection } from "@/composables/useSettingsSection.js";
import { useSettingsStore } from "@/stores/settings.js";
import { settingsApi } from "@/api/settingsApi.js";
import { toast } from "@/composables/useToast.js";
import SettingInput from "@/components/common/SettingInput.vue";
import { Loader2, Upload, ImagePlus, Trash2 } from "lucide-vue-next";

const props = defineProps({
  settings: { type: Object, required: true },
});
const emit = defineEmits(["saved"]);

const { t } = useI18n();
const { saving, errors, save, fieldError } = useSettingsSection(emit);
const platformSettings = useSettingsStore();

const form = reactive({
  primary_color: "#f59e0b",
  theme: "system",
  footer_copyright: "",
});

// Website logo: the persisted public path plus the pending upload file.
const logoUploading = ref(false);
const logoPending = ref(false);
const logoPendingPreview = ref("");
const selectedLogoFile = ref(null);

const themes = [
  { value: "light", label: t("themeLight") },
  { value: "dark", label: t("themeDark") },
  { value: "system", label: t("themeSystem") },
];

const HEX_RE = /^#([0-9a-fA-F]{6})$/;

const primaryColorValid = computed(() => HEX_RE.test(form.primary_color));

/** Current logo source: a freshly-picked file preview wins over the saved logo. */
const logoSource = computed(() => {
  if (logoPendingPreview.value) return logoPendingPreview.value;
  return platformSettings.logo;
});

watch(
  () => props.settings,
  (s) => {
    if (!s) return;
    form.primary_color = s["appearance.primary_color"] ?? "#f59e0b";
    form.theme = s["appearance.theme"] ?? "system";
    form.footer_copyright = s["appearance.footer_copyright"] ?? "";
  },
  { immediate: true }
);

function validate() {
  const errs = {};
  if (!HEX_RE.test(form.primary_color.trim())) {
    errs["appearance.primary_color"] = t("invalidHexColor");
  }
  return errs;
}

function hexToInput(raw) {
  return HEX_RE.test(raw.trim()) ? raw : "#f59e0b";
}

function onLogoSelected(event) {
  const file = event.target.files?.[0];
  if (!file) return;
  selectedLogoFile.value = file;
  logoPending.value = true;
  logoPendingPreview.value = URL.createObjectURL(file);
}

function clearLogoSelection() {
  selectedLogoFile.value = null;
  logoPending.value = false;
  logoPendingPreview.value = "";
}

/**
 * Upload the chosen logo to the backend (POST /api/admin/settings/logo),
 * which persists it as `appearance.logo` and deletes the previous file.
 * Refreshes the public settings so every navbar/footer re-renders.
 */
async function uploadLogo() {
  if (!selectedLogoFile.value) return;
  logoUploading.value = true;
  try {
    const fd = new FormData();
    fd.append("image", selectedLogoFile.value);
    await settingsApi.uploadLogo(fd);
    clearLogoSelection();
    await platformSettings.load(true);
    toast(t("logoUploaded"), "success");
  } catch (e) {
    toast(e.response?.data?.message || e.message || t("logoUploadFailed"), "error");
  } finally {
    logoUploading.value = false;
  }
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
    "appearance.primary_color": form.primary_color.trim(),
    "appearance.theme": form.theme,
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

    <!-- Website Logo (replaces the old Favicon URL field) -->
    <div class="mb-6">
      <label class="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-300">{{ t('settingsWebsiteLogo') }}</label>
      <div class="flex items-center gap-4">
        <span
          class="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-slate-50 dark:border-slate-600 dark:bg-slate-700"
        >
          <img
            v-if="logoSource"
            :src="logoSource"
            :alt="t('settingsWebsiteLogo')"
            class="h-full w-full object-contain p-1"
          />
          <ImagePlus v-else :size="22" class="text-slate-400" />
        </span>

        <div class="min-w-0 flex-1">
          <div class="flex flex-wrap items-center gap-2">
            <label
              class="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 transition hover:border-primary hover:text-primary dark:hover:border-primary"
            >
              <Upload :size="14" />
              {{ platformSettings.logo ? t('replaceLogo') : t('chooseLogo') }}
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                class="hidden"
                :disabled="logoUploading"
                @change="onLogoSelected"
              />
            </label>

            <button
              v-if="logoPending"
              type="button"
              @click="uploadLogo"
              :disabled="logoUploading"
              class="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-bold text-primary-contrast shadow-sm transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Loader2 v-if="logoUploading" :size="14" class="animate-spin" />
              {{ logoUploading ? t("uploading") : t("uploadLogo") }}
            </button>

            <button
              v-if="logoPending"
              type="button"
              @click="clearLogoSelection"
              class="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-600 px-3 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 transition hover:bg-slate-100 dark:hover:bg-slate-600"
            >
              <Trash2 :size="14" />
              {{ t("cancel") }}
            </button>
          </div>
          <p class="mt-1.5 text-xs text-slate-400 dark:text-slate-500">{{ t('settingsLogoHint') }}</p>
        </div>
      </div>
    </div>

    <div class="grid grid-cols-1 gap-5 sm:grid-cols-2">
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

    <div class="mt-5 max-w-md">
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