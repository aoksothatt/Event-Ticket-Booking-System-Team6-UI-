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
import {
  getContrastColor,
  hexToRgb,
  mixHex,
  normalizeHex,
} from "../utils/color.js";

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
function applyBrandTokens(hex) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  const primary = normalizeHex(hex || "#f59e0b");
  const { r, g, b } = hexToRgb(primary);
  const contrast = getContrastColor(primary);

  // --primary-color is the canonical token (set both the base and the
  // derived tokens). Space-separated channels: the emitted utilities are the
  // modern `rgb(var(--color-primary-rgb) / <alpha>)` form, which REQUIRES
  // "245 158 11" (commas would produce an invalid, ignored color).
  root.style.setProperty("--primary-color", primary);
  root.style.setProperty("--color-primary", primary);
  root.style.setProperty("--color-primary-rgb", `${r} ${g} ${b}`);
  root.style.setProperty("--color-primary-contrast", contrast);
  root.style.setProperty("--primary-color-contrast", contrast);
  root.style.setProperty("--color-primary-hover", mixHex(primary, "#000000", 0.88));
  root.style.setProperty("--color-primary-active", mixHex(primary, "#000000", 0.78));

  const supportsColorMix =
    typeof window !== "undefined" &&
    !!window.CSS?.supports?.("color", "color-mix(in srgb, red, black)");
  if (!supportsColorMix) {
    const dark = root.classList.contains("dark");
    root.style.setProperty(
      "--color-primary-accent",
      dark ? mixHex(primary, "#ffffff", 0.7) : mixHex(primary, "#000000", 0.55)
    );
  }
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
  const themeSetting = computed(() => values.value["appearance.theme"] || "system");
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
    document.documentElement.classList.toggle(
      "dark",
      theme === "dark" || (theme === "system" && prefersDark)
    );
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
    favicon,
    primaryColor,
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
  };
});