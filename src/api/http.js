/**
 * Base HTTP module — Axios-based
 *
 * Every request:
 *  - prepends VITE_API_BASE (or "/api" via the Vite dev proxy)
 *  - attaches `Authorization: Bearer <token>` automatically via interceptor
 *  - unwraps JSON and normalizes Laravel API error responses
 *  - clears local auth on 401
 */

import axios from "axios";
import { getToken, clearAuth } from "./auth.js";

export const API_BASE = import.meta.env.VITE_API_BASE || "/api";

export const STORAGE_BASE =
  API_BASE.replace(/\/api\/?$/, "") + "/storage";

export const USE_MOCK_FALLBACK = false;
export * as mockData from "./mockData.js";

/**
 * Shared Axios instance.
 * - baseURL points to /api (proxied to Laravel in dev)
 * - request interceptor attaches the JWT token
 * - response interceptor normalizes errors and clears auth on 401
 */
const http = axios.create({
  baseURL: API_BASE,
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
});

// ── Request interceptor: attach Bearer token ────────────────────────────────
http.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ── Response interceptor: normalize errors ──────────────────────────────────
http.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      if (error.config?.headers?.Authorization) {
        clearAuth();
      }
    }
    return Promise.reject(error);
  }
);

/**
 * GET request — returns the Laravel response body directly.
 *
 * Laravel wraps responses in { success, data, message, ... }.
 * Axios wraps that in { data: { success, data, ... }, status, ... }.
 * We return response.data so callers get the Laravel body directly:
 *
 *   const res = await get("/events");
 *   // res = { success: true, data: { data: [...], current_page, ... } }
 *   // res.data = { data: [...], current_page, ... }  (the paginator)
 *   // res.data.data = [...events]
 */
export function get(path, params) {
  return http.get(path, { params }).then((r) => r.data);
}

/** POST request — returns the Laravel response body directly. */
export function post(path, body) {
  return http.post(path, body).then((r) => r.data);
}

/** PUT request — returns the Laravel response body directly. */
export function put(path, body) {
  return http.put(path, body).then((r) => r.data);
}

/** PATCH request — returns the Laravel response body directly. */
export function patch(path, body) {
  return http.patch(path, body).then((r) => r.data);
}

/** FormData POST — for file uploads. Axios auto-sets multipart headers. */
export function postFormData(path, formData) {
  return http.post(path, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  }).then((r) => r.data);
}

/** FormData PUT — for file uploads. */
export function putFormData(path, formData) {
  return http.put(path, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  }).then((r) => r.data);
}

/** DELETE request — returns the Laravel response body directly. */
export function del(path) {
  return http.delete(path).then((r) => r.data);
}

/** Raw axios instance for advanced use cases. */
export default http;
