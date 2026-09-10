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
 * Fetch the authenticated customer's own check-ins (for their dashboard).
 */
export async function getMyCheckIns() {
  const response = await get("/my/check-ins");
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
 * STEP 1 — Lookup a ticket by its QR token / ticket code WITHOUT checking it
 * in. Returns the ticket details + a `valid` flag so the frontend can render
 * the ticket and enable/disable the check-in button.
 * @param {string} qrCode Raw token or scanner URL
 */
export async function lookupTicket(qrCode) {
  const token = extractToken(qrCode);
  return post("/tickets/lookup", { ticket_code: token });
}

/**
 * STEP 2 — Check in a previously validated ticket. Atomic on the backend
 * (row lock + transaction), so a ticket is only ever checked in once.
 * @param {string} qrCode Raw token or scanner URL
 */
export async function checkInTicket(qrCode) {
  const token = extractToken(qrCode);
  return post("/tickets/check-in", { ticket_code: token });
}

/**
 * Verify & check in a ticket by its QR token or ticket code.
 * Extracts raw token if a full scanner URL is supplied.
 * Marks ticket status as 'used' and records a CheckIn record automatically.
 * @param {string} qrToken Token or scanner URL
 */
export async function verifyTicket(qrToken) {
  let token = extractToken(qrToken);
  const response = await post("/tickets/verify", { qr_token: token });
  return response;
}

/**
 * Self-serve check-in for the ticket owner (customer scans their own QR).
 * Hits POST /my/tickets/self-checkin. Only works for the authenticated
 * owner's own ACTIVE ticket and inside the event time window.
 * @param {string} ticketCode Raw token or scanner URL
 */
export async function selfCheckIn(ticketCode) {
  const token = extractToken(ticketCode);
  const response = await post("/my/tickets/self-checkin", { ticket_code: token });
  return response;
}

/**
 * Pull the raw token out of a QR value. Accepts a plain token (qr_token or
 * ticket_code) or a full scanner URL containing `?ticket=...`/`?qr_token=...`.
 */
function extractToken(value) {
  let token = (value || "").trim();
  if (token.includes("ticket=") || token.includes("qr_token=")) {
    try {
      const parsed = new URL(token, window.location.origin);
      token = parsed.searchParams.get("ticket") || parsed.searchParams.get("qr_token") || token;
    } catch {
      const match = token.match(/[?&](?:ticket|qr_token)=([^&]+)/);
      if (match) token = match[1];
    }
  }
  return token;
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
  getMyCheckIns,
  getCheckIn,
  createCheckIn,
  updateCheckIn,
  lookupTicket,
  checkInTicket,
  verifyTicket,
  selfCheckIn,
  getTickets,
  cancelTicket,
};

export default checkInApi;
