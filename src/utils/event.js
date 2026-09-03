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
