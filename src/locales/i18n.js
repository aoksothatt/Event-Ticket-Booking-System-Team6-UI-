import { createI18n } from "vue-i18n";
import en from "./en.json";
import km from "./km.json";

const STORAGE_KEY = "locale";
const LEGACY_STORAGE_KEY = "bilit_locale";

function getSavedLocale() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && ["en", "km"].includes(saved)) return saved;
    // Migrate from the previous storage key so returning users keep their choice.
    const legacy = localStorage.getItem(LEGACY_STORAGE_KEY);
    if (legacy && ["en", "km"].includes(legacy)) return legacy;
  } catch (_) {}
  return "en";
}

const i18n = createI18n({
  legacy: false,
  locale: getSavedLocale(),
  fallbackLocale: "en",
  messages: { en, km },
});

export function setLocale(locale) {
  if (!["en", "km"].includes(locale)) return;
  i18n.global.locale.value = locale;
  try {
    localStorage.setItem(STORAGE_KEY, locale);
  } catch (_) {}
  document.documentElement.lang = locale;

  // Sync with Laravel backend session
  fetch(`/language/${locale}`, { method: "GET", credentials: "same-origin" }).catch(() => {});
}

export function getLocale() {
  return i18n.global.locale.value;
}

// Set initial lang attribute
document.documentElement.lang = getSavedLocale();

export default i18n;
