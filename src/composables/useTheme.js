import { ref, watch, onMounted } from "vue";

const STORAGE_KEY = "theme";
const isDark = ref(false);
let transitionTimer = null;

function applyTheme() {
  if (isDark.value) {
    document.documentElement.classList.add("dark");
  } else {
    document.documentElement.classList.remove("dark");
  }
}

function persistTheme() {
  try {
    localStorage.setItem(STORAGE_KEY, isDark.value ? "dark" : "light");
  } catch (e) {
    // Storage unavailable (private mode, blocked cookies, quota) — the theme
    // still applies for this session, it just won't be remembered.
  }
}

function loadSavedTheme() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved !== null) return saved === "dark";
  } catch (e) {
    // Fall through to the OS preference when storage is unavailable.
  }
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

function animateThemeSwitch() {
  const html = document.documentElement;
  html.classList.add("theme-switching");
  clearTimeout(transitionTimer);
  transitionTimer = setTimeout(() => html.classList.remove("theme-switching"), 350);
}

export function useTheme() {
  onMounted(() => {
    isDark.value = loadSavedTheme();
    applyTheme();
  });

  watch(isDark, () => {
    applyTheme();
    persistTheme();
    animateThemeSwitch();
  });

  function toggle() {
    isDark.value = !isDark.value;
    applyTheme();
    persistTheme();
    animateThemeSwitch();
  }

  return { isDark, toggle };
}