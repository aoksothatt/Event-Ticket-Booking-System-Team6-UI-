/**
 * Environment configuration.
 *
 * Every `import.meta.env.*` variable is read exactly once in this module so
 * the rest of the app uses plain constants instead of spreading environment
 * lookups across the codebase. All URLs are normalised to have no trailing
 * slash to keep string concatenation predictable.
 */

/**
 * Root URL of the Laravel backend (no trailing slash).
 */
export const BACKEND_URL = String(
  import.meta.env.VITE_BACKEND_URL || "http://localhost:8000"
).replace(/\/+$/, "");

/**
 * Axios base URL passed to the shared HTTP client.
 * Defaults to "/api", which is proxied to Laravel by the Vite dev server
 * (see vite.config.js) so no CORS configuration is required locally.
 */
export const API_BASE = String(
  import.meta.env.VITE_API_BASE || "/api"
).replace(/\/+$/, "") || "/api";

/**
 * Full URL the browser is redirected to when the user clicks
 * "Continue with Google". This is a Laravel *web* route (not under /api),
 * so it must point at the backend with an absolute URL.
 */
export const GOOGLE_REDIRECT_URL = String(
  import.meta.env.VITE_GOOGLE_REDIRECT_URL || `${BACKEND_URL}/auth/google`
).replace(/\/+$/, "");

/**
 * Absolute URL of this Vue app. Used only for building links and logging,
 * never sent to the backend as a redirect target verbatim.
 */
export const APP_URL = String(
  import.meta.env.VITE_APP_URL || "http://localhost:5173"
).replace(/\/+$/, "");

/**
 * sessionStorage key used to remember where the user wanted to go before
 * they were asked to sign in. The round-trip leaves the SPA for Google OAuth,
 * so the destination has to survive a full page load (sessionStorage does,
 * unlike plain memory).
 */
export const INTENDED_ROUTE_KEY = "bilit_intended_route";