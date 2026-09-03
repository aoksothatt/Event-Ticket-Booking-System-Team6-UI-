/**
 * Base HTTP module
 * A lightweight axios-like wrapper built on top of fetch so we can
 * reuse the existing token storage from src/api/auth.js without adding
 * a new dependency to the project.
 *
 * Every request:
 *  - prepends VITE_API_BASE (or "/api" via the Vite dev proxy)
 *  - attaches `Authorization: Bearer <token>` automatically
 *  - unwraps JSON and normalizes Laravel API error responses
 *  - clears local auth on 401
 */

import { getToken, clearAuth } from "./auth.js";

export const API_BASE = import.meta.env.VITE_API_BASE || "/api";

/**
 * Base origin for publicly-served files (Laravel /storage).
 * When VITE_API_BASE is "http://127.0.0.1:8000/api" this yields
 * "http://127.0.0.1:8000/storage". When running through the dev proxy
 * (API_BASE = "/api") it yields "/storage" (see vite proxy caveat).
 */
export const STORAGE_BASE =
  API_BASE.replace(/\/api\/?$/, "") + "/storage";

// Whether to fall back to bundled mock data when the API is unavailable.
// Set to false (and remove src/api/mockData.js) once the backend is wired up.
export const USE_MOCK_FALLBACK = true;

// Link to mock data for modules that opt in to the fallback.
export * as mockData from "./mockData.js";

/**
 * Builds a proper URL from a path, optionally appending a query string.
 * Laravel (and pagination) return the shape `path?query`.
 */
function buildUrl(path, params) {
  let url = `${API_BASE}${path}`;
  if (params && typeof params === "object") {
    const qs = Object.entries(params)
      .filter(([, value]) => value !== undefined && value !== null && value !== "")
      .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
      .join("&");
    if (qs) url += `${url.includes("?") ? "&" : "?"}${qs}`;
  }
  return url;
}

/**
 * Parses a response body, keeping track of whether it was JSON or text.
 */
async function parseBody(response) {
  const text = await response.text();
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    return { _raw: text };
  }
}

/**
 * Throws a normalized Error for non-OK responses, attaching `status`
 * and `data` for callers that need them (e.g. 422 validation).
 */
function throwHttpError(response, data) {
  const message =
    data?.message ||
    data?.error ||
    (typeof data === "object" && data !== null
      ? Object.values(data)
          .flat()
          .filter((v) => typeof v === "string")
          .join(" ")
      : "") ||
    (response.status === 401
      ? "Your session has expired. Please sign in again."
      : response.status === 404
        ? "The requested resource was not found."
        : "Something went wrong. Please try again.");

  const error = new Error(message);
  error.status = response.status;
  error.data = data;
  return error;
}

/**
 * Core request helper.
 * @param {string} path  e.g. "/events" or "/events/12"
 * @param {object} options  fetch options (+ optional `params` query object)
 */
export async function request(path, options = {}) {
  const { params, ...fetchOptions } = options;

  const headers = {
    Accept: "application/json",
    "Content-Type": "application/json",
    ...(fetchOptions.headers || {}),
  };

  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  let response;
  try {
    response = await fetch(buildUrl(path, params), { ...fetchOptions, headers });
  } catch (error) {
    // Network-level failure (backend down, offline).
    const networkError = new Error(
      "Unable to reach the server. Please check your connection and try again."
    );
    networkError.status = 0;
    networkError.isNetwork = true;
    throw networkError;
  }

  const data = await parseBody(response);

  if (!response.ok) {
    if (response.status === 401) {
      // Token is invalid or expired — clear local auth state.
      clearAuth();
    }
    throw throwHttpError(response, data);
  }

  return data;
}

/** GET helper. */
export function get(path, params) {
  return request(path, { method: "GET", params });
}

/** POST helper with JSON body. */
export function post(path, body) {
  return request(path, { method: "POST", body: JSON.stringify(body ?? {}) });
}

/** PUT/PATCH helper with JSON body. */
export function put(path, body, method = "PUT") {
  return request(path, { method, body: JSON.stringify(body ?? {}) });
}

/** DELETE helper. */
export function del(path) {
  return request(path, { method: "DELETE" });
}
