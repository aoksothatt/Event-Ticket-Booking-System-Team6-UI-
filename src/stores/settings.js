/**
 * Settings store (Pinia) — reactive platform settings for the whole app.
 *
 * On boot (see main.js) `load()` fetches the public settings endpoint and
 * applies the platform branding to the document (title, favicon, brand color
 * CSS variables, first-visit theme). Components read the reactive computed
 * values (platformName, primaryColor, bookingsEnabled, maintenanceMode, ...)
 * so the UI re-renders when a fetch completes.
 *
 * The endpoint only exposes non-sensitive values —
 * credentials never reach the frontend.
 */

import { computed, ref } from "vue";
import { defineStore } from "pinia";
import { settingsApi } from "../api/settingsApi.js";
import { STORAGE_BASE } from "../api/http.js";

/**
 * Normalize a "#RGB"/"#RRGGBB" hex string; returns `fallback` when invalid.
 */
function normalizeHex(hex, fallback = "#f59e0b") {
  let h = String(hex || "").trim().replace("#", "");
  if (/^[0-9a-fA-F]{3}$/.test(h)) h = h.split("").map((c) => c + c).join("");
  if (!/^[0-9a-fA-F]{6}$/.test(h)) return fallback;
  return `#${h.toLowerCase()}`;
}

/** Parse a hex color into its { r, g, b } channels. */
function hexToRgb(hex) {
  const h = normalizeHex(hex).replace("#", "");
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
  };
}

/** Build a "#RRGGBB" string from channel values. */
function rgbToHex(r, g, b) {
  return `#${((1 << 24) | ((r << 16) | (g << 8) | b)).toString(16).slice(1)}`;
}

/** Blend two hex colors; `weightA` = how much of A (0..1) to keep. */
function mixHex(hexA, hexB, weightA = 0.5) {
  const a = hexToRgb(hexA);
  const b = hexToRgb(hexB);
  return rgbToHex(
    Math.round(a.r * weightA + b.r * (1 - weightA)),
    Math.round(a.g * weightA + b.g * (1 - weightA)),
    Math.round(a.b * weightA + b.b * (1 - weightA))
  );
}

/** WCAG relative luminance (0..1) of a hex color. */
function luminance(hex) {
  const { r, g, b } = hexToRgb(hex);
  const linear = (v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * linear(r) + 0.7152 * linear(g) + 0.0722 * linear(b);
}

/**
 * Pick readable text for ON-primary fills: near-black on light colors,
 * white on dark colors (keeps buttons legible for any chosen brand color).
 */
function contrastText(hex) {
  return luminance(hex) > 0.4 ? "#111111" : "#ffffff";
}

/**
 * Push the theme color onto the document CSS variables that back the primary
 * Tailwind palette (see index.css for the fallback definitions).
 *
 * The base color, its space-separated rgb channels and the contrast text are
 * always set. Hover/active tones are ALSO derived here (from the same weights
 * used by the color-mix() fallbacks in index.css) so every browser renders the
 * exact chosen brand color on hover/active regardless of color-mix() support.
 * The accent token is left to the stylesheet (it has its own .dark override);
 * an explicit JS value is only supplied when color-mix() is unavailable.
 */
function applyPaletteTokens(root, name, hex, dark) {
  const color = normalizeHex(hex);
  const { r, g, b } = hexToRgb(color);
  root.style.setProperty(`--color-${name}`, color);
  root.style.setProperty(`--color-${name}-rgb`, `${r} ${g} ${b}`);
  root.style.setProperty(`--color-${name}-contrast`, contrastText(color));
  root.style.setProperty(`--color-${name}-hover`, mixHex(color, "#000000", 0.88));
  root.style.setProperty(`--color-${name}-active`, mixHex(color, "#000000", 0.78));
  const supportsColorMix =
    typeof window !== "undefined" &&
    !!window.CSS?.supports?.("color", "color-mix(in srgb, red, black)");
  if (supportsColorMix) {
    root.style.removeProperty(`--color-${name}-accent`);
  } else {
    root.style.setProperty(
      `--color-${name}-accent`,
      dark ? mixHex(color, "#ffffff", 0.7) : mixHex(color, "#000000", 0.55)
    );
  }
}

function applyBrandTokens(primaryHex, secondaryHex) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  const primary = normalizeHex(primaryHex || "#f59e0b");
  const secondary = normalizeHex(secondaryHex || "#334155", "#334155");
  const dark = root.classList.contains("dark");

  // --primary-color is the canonical token (set both the base and the
  // derived tokens). Space-separated channels: the emitted utilities are the
  // modern `rgb(var(--color-primary-rgb) / <alpha>)` form, which REQUIRES
  // "245 158 11" (commas would produce an invalid, ignored color).
  root.style.setProperty("--primary-color", primary);
  applyPaletteTokens(root, "primary", primary, dark);
  applyPaletteTokens(root, "secondary", secondary, dark);
  root.style.setProperty("--primary-color-contrast", contrastText(primary));
}

export const useSettingsStore = defineStore("settings", () => {
  const values = ref({});
  const loaded = ref(false);
  const loading = ref(false);

  // ---- Branding / general ----
  const platformName = computed(() => values.value["general.platform_name"] || "EventHub");
  const platformDescription = computed(() => values.value["general.platform_description"] || "");

  const favicon = computed(() => values.value["appearance.favicon"] || "");
  const primaryColor = computed(() => values.value["appearance.primary_color"] || "#f59e0b");
  const secondaryColor = computed(() => values.value["appearance.secondary_color"] || "#334155");
  const themeSetting = computed(() => values.value["appearance.theme"] || "system");
  const footerCopyright = computed(() => values.value["appearance.footer_copyright"] || "");
  const logoUnavailable = ref(false);

  /**
   * Website logo URL. The backend stores the public-disk path
   * (e.g. "logos/abc.png"); full absolute URLs pass straight through.
   */
  const logo = computed(() => {
    const raw = String(values.value["appearance.logo"] || "").trim();
    if (!raw || logoUnavailable.value) return "";
    const apiUrl = String(values.value["appearance.logo_url"] || "").trim();
    if (apiUrl) return apiUrl;
    if (/^(https?:|data:)/i.test(raw)) return raw;
    const path = raw.replace(/^\/?(?:public\/|storage\/)+/i, "").replace(/^\/+/, "");
    if (!path) return "";
    return `${STORAGE_BASE}/${path}`;
  });

  // ---- Booking constraints ----
  const bookingsEnabled = computed(() => values.value["booking.enabled"] !== false);
  const minTickets = computed(() => Number(values.value["booking.min_tickets"] || 1));
  const maxTickets = computed(() => Number(values.value["booking.max_tickets"] || 10));
  const cancellationEnabled = computed(() => values.value["booking.cancellation_enabled"] !== false);
  const cancellationDeadlineHours = computed(() => Number(values.value["booking.cancellation_deadline"] || 24));
  const requirePhone = computed(() => values.value["booking.require_phone"] === true);
  const requireEmailVerification = computed(() => values.value["booking.require_email_verification"] === true);

  // ---- Payment ----
  const paymentEnabled = computed(() => values.value["payment.enabled"] !== false);
  const bakongEnabled = computed(() => values.value["payment.bakong_enabled"] !== false);
  const paymentCurrency = computed(() => values.value["payment.currency"] || "USD");

  // ---- Users ----
  const registrationEnabled = computed(() => values.value["user.registration_enabled"] !== false);
  const googleLoginEnabled = computed(() => values.value["user.google_login"] !== false);

  // ---- Events / tickets ----
  const adminApprovalRequired = computed(() => values.value["event.admin_approval_required"] === true);
  const allowCancellation = computed(() => values.value["event.allow_cancellation"] !== false);
  const qrEnabled = computed(() => values.value["ticket.qr_enabled"] !== false);

  // ---- System ----
  const maintenanceMode = computed(() => values.value["system.maintenance_mode"] === true);
  const maintenanceMessage = computed(
    () =>
      values.value["system.maintenance_message"] ||
      "We're currently performing maintenance. Please come back later."
  );

  /** Apply platform branding to the DOM (title, favicon, brand colors, theme). */
  function applyBranding() {
    applyBrandTokens(primaryColor.value, secondaryColor.value);
    document.title = platformName.value
      ? `${platformName.value} — Events & Ticket Booking`
      : "Events & Ticket Booking";

    const favLink = document.querySelector("link[rel='icon']");
    if (favLink) favLink.href = favicon.value || "/favicon.svg";

    // Platform theme is the default for first-time visitors (no explicit
    // choice stored). Users who picked a theme themselves keep their choice.
    try {
      if (localStorage.getItem("theme") !== null) return;
    } catch {
      /* storage unavailable — default behaviour */
    }
    const theme = String(themeSetting.value || "system");
    const prefersDark = window.matchMedia?.("(prefers-color-scheme: dark)")?.matches ?? false;
    document.documentElement.classList.toggle(
      "dark",
      theme === "dark" || (theme === "system" && prefersDark)
    );
    applyBrandTokens(primaryColor.value, secondaryColor.value);
  }

  /**
   * Live preview: apply a candidate primary color without persisting it.
   * Used by the Appearance settings screen before "Save Changes" so the admin
   * sees the theme across the app instantly. applyBranding()/load() reset it
   * to the saved value.
   */
  function previewColor(hex) {
    applyBrandTokens(hex, secondaryColor.value);
  }

  function previewColors(primary, secondary) {
    applyBrandTokens(primary, secondary);
  }

  function markLogoUnavailable() {
    logoUnavailable.value = true;
  }

  function syncFromBackend(settings, logoUrl = "") {
    if (!settings || typeof settings !== "object") return;
    const hasLogo = Object.prototype.hasOwnProperty.call(settings, "appearance.logo");
    const logoChanged = hasLogo && settings["appearance.logo"] !== values.value["appearance.logo"];
    const updated = { ...settings };
    if (logoChanged) {
      logoUnavailable.value = false;
      if (!logoUrl && !Object.prototype.hasOwnProperty.call(updated, "appearance.logo_url")) {
        updated["appearance.logo_url"] = "";
      }
    }
    if (logoUrl) updated["appearance.logo_url"] = logoUrl;
    values.value = { ...values.value, ...updated };
    loaded.value = true;
    applyBranding();
  }

  /**
   * Fetch the public settings once at boot. Failures are silent — the app
   * simply keeps its built-in defaults (brand color #f59e0b, EventHub, etc.).
   */
  async function load(force = false) {
    if (loaded.value && !force) return;
    loading.value = true;
    try {
      const res = await settingsApi.getPublicSettings();
      const settings = res?.data?.settings || {};
      syncFromBackend(settings);
    } catch {
      /* endpoint unreachable — use defaults */
    } finally {
      loading.value = false;
    }
  }

  return {
    values,
    loaded,
    loading,
    platformName,
    platformDescription,
    logo,
    favicon,
    primaryColor,
    secondaryColor,
    themeSetting,
    footerCopyright,
    bookingsEnabled,
    minTickets,
    maxTickets,
    cancellationEnabled,
    cancellationDeadlineHours,
    requirePhone,
    requireEmailVerification,
    paymentEnabled,
    bakongEnabled,
    paymentCurrency,
    registrationEnabled,
    googleLoginEnabled,
    adminApprovalRequired,
    allowCancellation,
    qrEnabled,
    maintenanceMode,
    maintenanceMessage,
    load,
    applyBranding,
    previewColor,
    previewColors,
    syncFromBackend,
    markLogoUnavailable,
  };
});
