/**
 * useSettingsSection
 * Shared save lifecycle for a settings section:
 *  - calls settingsApi.updateSettings with the section payload
 *  - shows a success toast and re-syncs the parent with the fresh settings
 *  - collects 422 validation errors keyed by the dotted setting key so they
 *    can be rendered next to each field (no page reload)
 */
import { ref } from "vue";
import { useI18n } from "vue-i18n";
import { toast } from "./useToast.js";
import { settingsApi } from "../api/settingsApi.js";

export function useSettingsSection(emit) {
  const { t } = useI18n();
  const saving = ref(false);
  const errors = ref({});

  async function save(payload) {
    saving.value = true;
    errors.value = {};
    try {
      const res = await settingsApi.updateSettings(payload);
      toast(t("settingsSaved"), "success");
      emit("saved", res?.data?.settings);
      return true;
    } catch (e) {
      const data = e?.response?.data;
      if (data?.errors) {
        errors.value = data.errors;
      }
      toast(data?.message || e?.message || t("errorMessage"), "error");
      return false;
    } finally {
      saving.value = false;
    }
  }

  function fieldError(key) {
    const list = errors.value[key];
    return list && list.length ? list[0] : "";
  }

  return { saving, errors, save, fieldError };
}