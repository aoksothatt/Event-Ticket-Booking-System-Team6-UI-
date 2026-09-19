/**
 * Event helpers — small pure functions used across cards, hero, and detail views.
 * Kept as a single module so formatting logic isn't duplicated.
 */

import { STORAGE_BASE } from "../api/http.js";

/** Returns the minimum ticket price for an event, or null when absent. */
export function minPrice(event) {
  const tickets = event?.ticket_types || event?.ticketTypes || [];
  if (!Array.isArray(tickets) || tickets.length === 0) return null;
  const prices = tickets
    .map((t) => Number(t?.price))
    .filter((n) => Number.isFinite(n));
  if (prices.length === 0) return null;
  return Math.min(...prices);
}

/**
 * Resolves a displayable cover image URL for an event.
 * Handles multiple shapes returned by the backend over time:
 *  - event.banner (string)
 *  - event.images: [{ image_path | image }]
 *  - event.cover / event.image (string)
 * Falls back to a themed placeholder.
 */
export function coverImage(event) {
  const storage = STORAGE_BASE;
  if (!event) return "";

  if (typeof event.banner === "string" && event.banner) {
    return event.banner.startsWith("http") ? event.banner : `${storage}/${event.banner}`;
  }

  const images = event.images || event.eventImages || [];
  if (Array.isArray(images) && images.length > 0) {
    const first = images[0];
    const src = first?.image_path || first?.image || first?.url;
    if (typeof src === "string" && src) {
      return src.startsWith("http") ? src : `${storage}/${src}`;
    }
  }

  if (typeof event.cover === "string" && event.cover) return event.cover;
  if (typeof event.image === "string" && event.image) return event.image;

  return "";
}

/** Formats a date string into something friendly like "Sat, Dec 20 2026". */
export function formatDate(dateStr) {
  if (!dateStr) return "";
  const date = new Date(`${dateStr}T00:00:00`);
  if (Number.isNaN(date.getTime())) return dateStr;
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/** Formats a time string like "19:00:00" into "7:00 PM". */
export function formatTime(timeStr) {
  if (!timeStr) return "";
  const match = /^(\d{1,2}):(\d{2})/.exec(timeStr);
  if (!match) return timeStr;
  let hours = Number(match[1]);
  const minutes = match[2];
  const meridiem = hours >= 12 ? "PM" : "AM";
  hours = hours % 12 || 12;
  return `${hours}:${minutes} ${meridiem}`;
}

/** Formats a full date-time (ISO or "YYYY-MM-DD HH:MM:SS") for timestamps
 * like check-in times / expiry, e.g. "Sep 8, 2026, 4:32 PM". */
export function formatDateTime(value) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

/** Returns the "YYYY-MM-DD" portion of a raw API date (handles full ISO
 * strings like "2026-09-20T00:00:00.000000Z" and plain "2026-09-20"). */
function datePortion(value) {
  if (!value) return "";
  return String(value).slice(0, 10);
}

/** Formats a "YYYY-MM-DD" (or full ISO) value as e.g. "Sep 20, 2026".
 * Parses the date portion as a LOCAL date so a midnight timestamp serialized
 * as "...T00:00:00.000000Z" never shifts to the previous day in negative UTC.
 */
function formatDateLocal(value) {
  const [y, m, d] = datePortion(value).split("-").map(Number);
  if (!y || !m || !d) return String(value ?? "");
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(y, m - 1, d));
}

/** Formats a "HH:MM[:SS]" time string (e.g. "07:00:00") as "7:00 AM"
 * (hour12 = true) or "07:00" (hour12 = false). */
function formatTimeHHMM(value, hour12) {
  const m = /^(\d{1,2}):(\d{2})/.exec(String(value ?? ""));
  if (!m) return String(value ?? "");
  const [hh, mm] = [Number(m[1]), Number(m[2])];
  if (hour12) {
    const meridiem = hh >= 12 ? "PM" : "AM";
    const hour = hh % 12 || 12;
    return `${hour}:${String(mm).padStart(2, "0")} ${meridiem}`;
  }
  return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
}

/**
 * Formats an event's date + time fields into friendly labels for the
 * DATES & TIMING column. Returns a single string so the template stays clean:
 *   - same-day  -> "Sep 20, 2026 · 7:00 AM - 11:00 AM"
 *   - multi-day -> "Sep 20 - Sep 21, 2026 · 7:00 AM - 11:00 AM"
 * Pass { hour12: false } for 24-hour ("07:00 - 11:00").
 */
export function formatDateTimeRange(event, { hour12 = true } = {}) {
  if (!event) return "";
  const s = datePortion(event.start_date);
  const e = datePortion(event.end_date);
  const sameDay = !e || s === e;

  const timeRange = [event.start_time, event.end_time]
    .filter(Boolean)
    .map((t) => formatTimeHHMM(t, hour12))
    .join(" - ");

  const fill = timeRange ? ` · ${timeRange}` : "";
  if (sameDay) return `${formatDateLocal(s)}${fill}`;
  return `${formatDateLocal(s)} - ${formatDateLocal(e)}${fill}`;
}

/** Indexes the "start," "end" halves of the formatted DATES & TIMING text so
 * the template can render a bold date on top with a lighter time below. */
export function formatDateTimeRangeParts(event, options = {}) {
  const rendered = formatDateTimeRange(event, options);
  const i = rendered.indexOf(" · ");
  if (i === -1) return { dateLabel: rendered, timeLabel: "" };
  return {
    dateLabel: rendered.slice(0, i),
    timeLabel: rendered.slice(i + 3),
  };
}

/** Formats a float price into a currency string. */
export function formatPrice(value, currency = "USD") {
  const num = Number(value);
  if (!Number.isFinite(num)) return "";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: Number.isInteger(num) ? 0 : 2,
  }).format(num);
}

/** Sorts events by closest future start_date (soonest first). */
export function sortByUpcoming(events) {
  const now = new Date();
  return [...(events || [])].sort((a, b) => {
    const da = new Date(`${a?.start_date ?? "2999-01-01"}T00:00:00`);
    const db = new Date(`${b?.start_date ?? "2999-01-01"}T00:00:00`);
    const diff = da - db;
    if (diff !== 0) return diff;
    return (a?.start_time || "").localeCompare(b?.start_time || "");
  });
}

/** Returns true when the event is still scheduled for the future. */
export function isUpcoming(event) {
  if (!event?.start_date) return true;
  return new Date(`${event.start_date}T23:59:59`) >= new Date();
}
