/**
 * color.js
 *
 * Centralized color helpers backing the platform theme. The admin-configured
 * Primary Color (appearance.primary_color) flows from the backend settings
 * API into document CSS variables (--primary-color / --color-primary), and
 * these helpers normalize/derive the derived tokens and the readable
 * on-primary text color.
 */

/** Normalize a "#RGB"/"#RRGGBB" hex string; returns `fallback` when invalid. */
export function normalizeHex(hex, fallback = "#f59e0b") {
  let h = String(hex || "").trim().replace("#", "");
  if (/^[0-9a-fA-F]{3}$/.test(h)) h = h.split("").map((c) => c + c).join("");
  if (!/^[0-9a-fA-F]{6}$/.test(h)) return fallback;
  return `#${h.toLowerCase()}`;
}

/** Parse a hex color into its { r, g, b } channels. */
export function hexToRgb(hex) {
  const h = normalizeHex(hex).replace("#", "");
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
  };
}

/** Build a "#RRGGBB" string from channel values. */
export function rgbToHex(r, g, b) {
  return `#${((1 << 24) | ((r << 16) | (g << 8) | b)).toString(16).slice(1)}`;
}

/** Blend two hex colors; `weightA` = how much of A (0..1) to keep. */
export function mixHex(hexA, hexB, weightA = 0.5) {
  const a = hexToRgb(hexA);
  const b = hexToRgb(hexB);
  return rgbToHex(
    Math.round(a.r * weightA + b.r * (1 - weightA)),
    Math.round(a.g * weightA + b.g * (1 - weightA)),
    Math.round(a.b * weightA + b.b * (1 - weightA))
  );
}

/** WCAG relative luminance (0..1) of a hex color. */
export function luminance(hex) {
  const { r, g, b } = hexToRgb(hex);
  const linear = (v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * linear(r) + 0.7152 * linear(g) + 0.0722 * linear(b);
}

/**
 * Pick a readable text/icon color to sit ON a filled Primary Color surface:
 * black on light Primary Colors, white on dark ones. This is what powers
 * --color-primary-contrast (and --primary-color-contrast), so the active nav
 * label/icon stays legible no matter which color the admin chooses.
 */
export function getContrastColor(hex) {
  return luminance(hex) > 0.4 ? "#000000" : "#ffffff";
}