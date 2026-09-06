/**
 * Check-In API
 * Handles attendee check-in logs and QR barcode verification against Laravel backend.
 */

import { get, post, put } from "./http.js";

/**
 * Fetch all check-in records.
 * @param {Object} params Optional query parameters
 */
export async function getCheckIns(params = {}) {
  const response = await get("/check-ins", params);
  return response?.data || response;
}

/**
 * Fetch a single check-in by ID.
 * @param {number|string} id Check-in ID
 */
export async function getCheckIn(id) {
  const response = await get(`/check-ins/${id}`);
  return response?.data || response;
}

/**
 * Create a check-in record directly.
 * @param {Object} data { booking_id, checked_by, status, ticket_id? }
 */
export async function createCheckIn(data) {
  const response = await post("/check-ins", data);
  return response?.data || response;
}

/**
 * Update check-in status (e.g. 'checked_in', 'completed', 'cancelled').
 * @param {number|string} id Check-in ID
 * @param {Object} data { status }
 */
export async function updateCheckIn(id, data) {
  const response = await put(`/check-ins/${id}`, data);
  return response?.data || response;
}

/**
 * Verify & check in a ticket by its QR token or ticket code.
 * Extracts raw token if a full scanner URL is supplied.
 * Marks ticket status as 'used' and records a CheckIn record automatically.
 * @param {string} qrToken Token or scanner URL
 */
export async function verifyTicket(qrToken) {
  let token = (qrToken || "").trim();
  // If the scanned string is a full URL, extract the token
  if (token.includes("qr_token=")) {
    try {
      const parsed = new URL(token, "http://localhost");
      token = parsed.searchParams.get("qr_token") || token;
    } catch {
      const match = token.match(/qr_token=([^&]+)/);
      if (match) token = match[1];
    }
  }

  const response = await post("/tickets/verify", { qr_token: token });
  return response;
}

/**
 * Fetch issued tickets (admin view).
 * @param {Object} params { search, status, per_page, page }
 */
export async function getTickets(params = {}) {
  const response = await get("/tickets", params);
  return response?.data || response;
}

/**
 * Cancel a customer ticket.
 * @param {number|string} id
 */
export async function cancelTicket(id) {
  const response = await post(`/tickets/${id}/cancel`);
  return response?.data || response;
}

export const checkInApi = {
  getCheckIns,
  getCheckIn,
  createCheckIn,
  updateCheckIn,
  verifyTicket,
  getTickets,
  cancelTicket,
};

export default checkInApi;
