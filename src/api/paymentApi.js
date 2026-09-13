/**
 * Payment API
 * Handles customer and admin payment transactions against Laravel's `/api/payments` endpoints.
 */

import { get, post } from "./http.js";

/**
 * Fetch all payments (admin/organizer/customer view).
 * @param {Object} params Optional query parameters
 */
export async function getPayments(params = {}) {
  const response = await get("/payments", params);
  return response?.data || response;
}

/**
 * Fetch the authenticated customer's own payments (for their dashboard).
 */
export async function getMyPayments() {
  const response = await get("/my/payments");
  return response?.data || response;
}

/**
 * Fetch the authenticated customer's aggregated dashboard totals.
 * Returns { total_bookings, total_spent, total_tickets, active_tickets,
 *           used_tickets, total_checkins, checked_in, total_reviews,
 *           avg_rating, total_favorites }.
 */
export async function getMySummary() {
  const response = await get("/my/summary");
  return response?.data || response;
}

/**
 * Fetch a single payment by ID.
 * @param {number|string} id Payment ID
 */
export async function getPayment(id) {
  const response = await get(`/payments/${id}`);
  return response?.data || response;
}

/**
 * Record a pending payment for a booking.
 *
 * NOTE: The backend never marks a payment as "paid" from this endpoint —
 * payments are only confirmed after it verifies the transaction with Bakong
 * (see checkoutApi.confirmPayment). This helper only creates a pending
 * record for legacy/dashboard purposes. To actually pay, use the Bakong
 * checkout flow instead.
 *
 * @param {Object} data Payload with booking_id (+ optional payment_method)
 */
export async function createPayment(data) {
  const response = await post("/payments", {
    booking_id: data.booking_id,
    payment_method: data.payment_method || "bakong_khqr",
  });
  return response?.data || response;
}

export const paymentApi = {
  getPayments,
  getMyPayments,
  getPayment,
  createPayment,
};

export default paymentApi;
