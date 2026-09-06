/**
 * Auth store (Pinia) — reactive authentication state for the whole app.
 *
 * The store is a thin, reactive wrapper around the low-level persistence and
 * API helpers in `../api/auth.js`. It exists so any component can do:
 *
 *   const auth = useAuthStore();
 *   auth.isAuthenticated  // boolean, reactive
 *   auth.user             // user object or null, reactive
 *   auth.booting          // true until restoreSession() has finished
 *
 * Design notes
 * ------------
 * - `token` and `user` are reactive refs backed by localStorage. Derived
 *   values (`isAuthenticated`, `role`, `isAdmin`) recompute from those refs,
 *   so the UI (navbar, dropdown, router guards, views) re-renders immediately
 *   when login/register/logout/profile-fetch update the session — no refresh.
 * - `syncToken`/`syncUser` re-read storage into the refs after every auth
 *   mutation (login, register, Google login, profile fetch, logout).
 * - `restoreSession()` is called once at app boot (see main.js). Every
 *   authenticated API call therefore has the obey of `booting` before the
 *   router guards fire, so a logged-in user never sees a login flash.
 *
 * API contract (Laravel backend)
 * ------------------------------
 *   POST /api/login    → { success, data: { access_token, user, ... } }
 *   POST /api/register → same shape (the backend auto-issues a token)
 *   POST /api/logout   → { success, message }
 *   GET  /api/user     → { success, data: user }
 */

import { computed, ref } from "vue";
import { defineStore } from "pinia";
import * as authApi from "../api/auth.js";
import http from "../api/http.js";

export const useAuthStore = defineStore("auth", () => {
  // Reactive snapshots of the current session. `token` and `user` are backed
  // by localStorage but mirrored into refs so every consumer (navbar, router
  // guards, views) re-renders immediately when login/register/logout happens
  // — no page refresh required.
  const token = ref(authApi.getToken());

  // Reactive snapshot of the current user. Initialised from whatever is
  // already persisted so a page refresh keeps the navbar/profile state.
  const user = ref(authApi.getUser());

  // True while a profile request is in flight.
  const loading = ref(false);

  // True until the boot-time session restore has completed.
  const booting = ref(true);

  // Derived, reactive values.
  const isAuthenticated = computed(() => Boolean(token.value));
  const role = computed(() => {
    const u = user.value;
    return String(u?.role || u?.data?.role || "").toLowerCase() || null;
  });
  const isAdmin = computed(() => ["admin", "organizer"].includes(role.value));

  /** Re-read the persisted token into the reactive snapshot. */
  function syncToken() {
    token.value = authApi.getToken();
  }

  /** Re-read the persisted user into the reactive snapshot. */
  function syncUser() {
    user.value = authApi.getUser();
  }

  /** Persist a token + user and refresh the snapshot. */
  function setSession(nextToken, nextUser) {
    authApi.setAuth(nextToken, nextUser);
    syncToken();
    syncUser();
  }

  /** Wipe the persisted session and the snapshot. */
  function clearSession() {
    authApi.clearAuth();
    token.value = null;
    user.value = null;
  }

  /**
   * Fetch the authenticated user's profile from the backend and keep the
   * stored copy in sync. Resolves with the user object (or null).
   */
  async function fetchUser() {
    loading.value = true;
    try {
      const body = await http.get("/user");
      // Laravel returns { success: true, data: user }, and axios wraps it in body.data
      const profile = body?.data?.data ?? body?.data?.user ?? body?.data ?? null;
      if (profile) {
        authApi.setAuth(authApi.getToken(), profile);
        syncToken();
        syncUser();
      }
      return profile;
    } finally {
      loading.value = false;
    }
  }

  /**
   * Called once at startup. If a JWT already exists (page refresh, returning
   * visitor) we re-validate it by reloading the profile; an expired/rejected
   * token (HTTP 401) clears the session. Network problems do NOT log the user
   * out — we keep the stored session and let the next request decide.
   */
  async function restoreSession() {
    if (!authApi.isAuthenticated()) {
      booting.value = false;
      return null;
    }
    try {
      return await fetchUser();
    } catch (error) {
      if (error?.response?.status === 401) {
        clearSession();
      }
      return null;
    } finally {
      booting.value = false;
    }
  }

  /**
   * Complete a Google OAuth handshake:
   * 1. Store the JWT the backend handed us in the callback URL.
   * 2. Fetch the user's profile so the app always works from authoritative
   *    data returned by the backend.
   */
  async function loginWithGoogle(googleToken) {
    setSession(googleToken, null);
    return fetchUser();
  }

  /** Email/password login — then refresh the authoritative profile. */
  async function login(credentials) {
    await authApi.login(credentials.email, credentials.password);
    syncToken();
    syncUser();
    return fetchUser();
  }

  /**
   * Email/password registration. The backend issues a JWT immediately, so we
   * auto-log the user in — no extra login step needed after signing up.
   */
  async function register(payload) {
    await authApi.register(payload);
    syncToken();
    syncUser();
    return fetchUser();
  }

  /** Log out on the backend and clear the local session. */
  async function logout() {
    try {
      await authApi.logout();
    } finally {
      user.value = null;
      token.value = null;
    }
  }

  return {
    user,
    loading,
    booting,
    token,
    isAuthenticated,
    role,
    isAdmin,
    syncUser,
    setSession,
    clearSession,
    fetchUser,
    restoreSession,
    loginWithGoogle,
    login,
    register,
    logout,
  };
});