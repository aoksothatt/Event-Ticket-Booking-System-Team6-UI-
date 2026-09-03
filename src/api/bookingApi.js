/**
 * Booking API
 * Hits Laravel's `/api/bookings` endpoint. The backend returns all
 * bookings (with `user`, `event`, `items.ticketType`, `payments`). We
 * filter to the currently logged-in user's bookings client-side, since
 * the index endpoint is not scoped per user in this build.
 */

import { getUser } from "./auth.js";
import { get, USE_MOCK_FALLBACK } from "./http.js";

export async function getMyTickets() {
  try {
    const response = await get("/bookings");
    const list = response?.data;
    const bookings = Array.isArray(list) ? list : [];
    const user = getUser();
    const userId = user?.id;
    const mine = userId
      ? bookings.filter(
          (b) => String(b?.user_id) === String(userId) || String(b?.user?.id) === String(userId)
        )
      : bookings;
    return mine;
  } catch (error) {
    if (USE_MOCK_FALLBACK && error.isNetwork) {
      return [];
    }
    throw error;
  }
}

export async function getBooking(id) {
  const response = await get(`/bookings/${id}`);
  return response?.data;
}
