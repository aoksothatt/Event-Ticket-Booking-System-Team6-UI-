/**
 * User / Profile API
 * Hits Laravel's `/api/me` and `/api/profile` endpoints for the
 * authenticated user's details.
 */

import { getUser } from "./auth.js";
import { get, USE_MOCK_FALLBACK } from "./http.js";

/** Fetches the authenticated user's profile (user + profile records). */
export async function getProfile() {
  try {
    const response = await get("/profile");
    return response?.data;
  } catch (error) {
    if (USE_MOCK_FALLBACK && error.isNetwork) {
      return { user: getUser(), profile: null };
    } 
    throw error;
  }
}

/** Fallback convenience: returns the locally stored user immediately. */
export function cachedUser() {
  return getUser();
}
