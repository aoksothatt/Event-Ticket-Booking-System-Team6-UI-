/**
 * Router guard middleware.
 *
 * Keeps all `beforeEach` navigation rules in one place so the router config
 * stays declarative. Uses the Pinia auth store through the shared instance
 * (see stores/index.js) to avoid circular imports.
 */

import { useAuthStore } from "../stores/auth.js";
import { pinia } from "../stores/index.js";

/** Role-aware home page: admins get the dashboard, everyone else the storefront. */
export function defaultHome(auth) {
  return auth.isAdmin ? "/admin/overview" : "/home";
}

/**
 * Global navigation guard.
 * - Unauthenticated users are sent to /login for protected routes.
 * - Non-admin roles are kept out of /admin/* routes.
 * - Authenticated users cannot visit auth pages (login/register/forgot),
 *   except the Google OAuth callback which must process the new token first.
 */
export function authGuard(to) {
  const auth = useAuthStore(pinia);

  // Protected route → must be authenticated.
  if (to.meta.requiresAuth && !auth.isAuthenticated) {
    return { name: "login", query: { redirect: to.fullPath } };
  }

  // Admin area is restricted to admin/organizer roles only.
  if (to.path.startsWith("/admin") && !auth.isAdmin) {
    return { path: "/home" };
  }

  // Auth pages are off-limits once logged in (except the OAuth callback).
  if (to.meta.layout === "auth" && !to.meta.allowAuthenticated) {
    if (auth.isAuthenticated) {
      return { path: defaultHome(auth) };
    }
  }

  return true;
}