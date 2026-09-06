/**
 * Auth redirect helpers — "remember where the user wanted to go, and take
 * them back there after they sign in."
 *
 * Three sources can point a user at the login page:
 *   1. A route guard (router binary: `?redirect=/some/path`).
 *   2. A guest action like "Buy Ticket" or favorite-toggle.
 *   3. The Google OAuth round-trip (full page navigation, so the intended
 *      route must survive in sessionStorage).
 *
 * This module normalises all of them into a single safe destination string.
 */

import { INTENDED_ROUTE_KEY } from "../config/index.js";
import { toast } from "./useToast.js";

/** Strip fragments/whitespace and reject any non-internal path. */
function sanitize(path) {
  if (typeof path !== "string" || !path) return null;
  const cleaned = path.split("#")[0];
  if (!cleaned.startsWith("/") || cleaned.startsWith("//")) return null;
  // Never let a user "redirect back" into another login/auth screen (loop).
  if (/^\/(login|register|forgot-password|auth(?:\/|\b))/.test(cleaned)) return null;
  return cleaned;
}

/**
 * Remember the current route (or an explicit path) before signing in.
 * Auth pages (/login, /register …) are intentionally skipped so a stored
 * intent — e.g. from "Buy Ticket" — is never accidentally overwritten while
 * the guest is completing authentication.
 */
export function saveIntendedRoute(currentFullPath = window.location.pathname + window.location.search) {
  const target = sanitize(currentFullPath);
  if (target) {
    sessionStorage.setItem(INTENDED_ROUTE_KEY, target);
  }
}

/** Read + clear the stored intended route (fire-and-forget, one use). */
export function consumeIntendedRoute() {
  const stored = sessionStorage.getItem(INTENDED_ROUTE_KEY);
  sessionStorage.removeItem(INTENDED_ROUTE_KEY);
  return sanitize(stored);
}

/**
 * Pick the final destination after a successful login.
 * Priority: explicit `?redirect=` query → stored intent → fallback.
 */
export function computeDestination({ queryRedirect = null, fallback = "/home" } = {}) {
  return sanitize(queryRedirect) || consumeIntendedRoute() || fallback;
}

/**
 * Redirect an unauthorised visitor to the login page, remembering where they
 * were headed and (optionally) explaining why they were interrupted.
 */
export function redirectToLogin(router, { message = null } = {}) {
  saveIntendedRoute();
  if (message) toast(message, "info");
  router.push({ name: "login" });
}