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
 * Tailwind palette. Hover/active/accent tones are derived in the stylesheet
 * with color-mix, so only the base color + rgb triplet + contrast are needed.
 */
function applyBrandTokens(hex) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  const primary = normalizeHex(hex || "#f59e0b");
  const { r, g, b } = hexToRgb(primary);
  root.style.setProperty("--color-primary", primary);
  // Space-separated channels: the emitted utilities are the modern
  // `rgb(var(--color-primary-rgb) / <alpha>)` form, which REQUIRES
  // "245 158 11" (commas would produce an invalid, ignored color).
  root.style.setProperty("--color-primary-rgb", `${r} ${g} ${b}`);
  root.style.setProperty("--color-primary-contrast", contrastText(primary));
}

export const useSettingsStore = defineStore("settings", () => {
  const values = ref({});
  const loaded = ref(false);
  const loading = ref(false);

  // ---- Branding / general ----
  const platformName = computed(() => values.value["general.platform_name"] || "EventHub");
  const platformDescription = computed(() => values.value["general.platform_description"] || "");
  const supportEmail = computed(() => values.value["general.support_email"] || "");
  const supportPhone = computed(() => values.value["general.support_phone"] || "");
  const defaultCurrency = computed(() => values.value["general.default_currency"] || "USD");
  const language = computed(() => values.value["general.language"] || "en");
  const timezone = computed(() => values.value["general.timezone"] || "Asia/Phnom_Penh");

  const logo = computed(() => values.value["appearance.logo"] || "");
  const favicon = computed(() => values.value["appearance.favicon"] || "");
  const primaryColor = computed(() => values.value["appearance.primary_color"] || "#f59e0b");
  const secondaryColor = computed(() => values.value["appearance.secondary_color"] || "#0f172a");
  const themeSetting = computed(() => values.value["appearance.theme"] || "system");
  const tagline = computed(() => values.value["appearance.tagline"] || "");
  const footerCopyright = computed(() => values.value["appearance.footer_copyright"] || "");

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
  const allowDownload = computed(() => values.value["ticket.allow_download"] !== false);
  const allowPrinting = computed(() => values.value["ticket.allow_printing"] !== false);

  // ---- System ----
  const maintenanceMode = computed(() => values.value["system.maintenance_mode"] === true);
  const maintenanceMessage = computed(
    () =>
      values.value["system.maintenance_message"] ||
      "We're currently performing maintenance. Please come back later."
  );

  /** Apply platform branding to the DOM (title, favicon, brand colors, theme). */
  function applyBranding() {
    applyBrandTokens(primaryColor.value);

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
    root.classList.toggle("dark", theme === "dark" || (theme === "system" && prefersDark));
  }

  /**
   * Live preview: apply a candidate primary color without persisting it.
   * Used by the Appearance settings screen before "Save Changes" so the admin
   * sees the theme across the app instantly. applyBranding()/load() reset it
   * to the saved value.
   */
  function previewColor(hex) {
    applyBrandTokens(hex);
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
      values.value = res?.data?.data?.settings || res?.data?.settings || {};
      loaded.value = true;
      applyBranding();
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
    supportEmail,
    supportPhone,
    defaultCurrency,
    language,
    timezone,
    logo,
    favicon,
    primaryColor,
    secondaryColor,
    themeSetting,
    tagline,
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
    allowDownload,
    allowPrinting,
    maintenanceMode,
    maintenanceMessage,
    load,
    applyBranding,
    previewColor,
  };
});