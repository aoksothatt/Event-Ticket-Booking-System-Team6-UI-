/**
 * Checkout API
 *
 * Clean checkout interface backed by the Bakong KHQR payment flow.
 * Delegates to the existing shared axios instance (http.js) and the
 * Bakong-specific helpers (bakongApi.js). All authentication (Bearer JWT)
 * is handled automatically by the http interceptor.
 *
 * Endpoints consumed:
 *   POST /api/checkout                     → create booking + payment + KHQR
 *   GET  /api/payments/:id/status          → lightweight local status poll
 *   POST /api/payments/:id/verify          → force Bakong verification (issues tickets)
 *
 * Flow:
 *   1. checkout({ event_id, items: [{ ticket_type_id, quantity }, ...] })
 *      → returns { booking, payment, qr_payload, deeplink, expires_at, amount, currency }
 *   2. Render qr_payload into a QR image via the `qrcode` library.
 *   3. If a deeplink was returned, offer a "Pay with Bakong app" link.
 *   4. Poll with checkPaymentStatus(paymentId) or confirmPayment(paymentId).
 *   5. When status is "paid" the booking is confirmed and tickets are issued.
 *
 * The backend generates the KHQR locally (PHP KHQR SDK); payment is only
 * confirmed after the backend verifies the transaction MD5 with Bakong — the
 * frontend never marks a payment as paid by itself.
 */

import {
  createBakongCheckout,
  getPaymentStatus,
  verifyPayment,
  formatCountdown,
} from "./bakongApi.js";

/**
 * Initiate a Bakong KHQR checkout.
 *
 * Creates a pending Booking + Payment on the backend and returns the
 * KHQR payload for the customer to scan (plus an optional wallet deeplink).
 * Pass every selected ticket line so the backend consolidates the whole
 * order into ONE booking + ONE payment + ONE KHQR.
 *
 * @param {{
 *   event_id: number,
 *   items: Array<{ ticket_type_id: number, quantity: number }>,
 *   booking_id?: number,
 * }} opts
 * @returns {Promise<{ success: boolean, data: { booking, payment, qr_payload, md5, deeplink, expires_at, amount, currency, poll_interval_seconds } }>}
 * @throws On validation error (422), auth error (401), Bakong failure (502/503), or network error.
 */
export async function checkout({ event_id, items, booking_id }) {
  return createBakongCheckout({ event_id, items, booking_id });
}

/**
 * Read the payment's LOCAL status (no Bakong call).
 *
 * Use for lightweight display updates. For authoritative confirmation
 * (that actually asks Bakong whether the customer has paid), use
 * `confirmPayment` instead.
 *
 * @param {number|string} paymentId
 * @returns {Promise<{ success: boolean, data: { payment_id, status, is_expired, paid_at, expires_at, booking_id, booking_status } }>}
 */
export async function checkPaymentStatus(paymentId) {
  return getPaymentStatus(paymentId);
}

/**
 * Ask the backend to verify the payment against Bakong and, if the customer
 * has paid, confirm the booking and issue the tickets.
 *
 * This is idempotent — safe to call repeatedly on a polling interval.
 * The backend will only generate tickets once (idempotent confirmation).
 *
 * @param {number|string} paymentId
 * @returns {Promise<{ success: boolean, data: { payment, status, booking_status, tickets_generated, tickets } }>}
 */
export async function confirmPayment(paymentId) {
  return verifyPayment(paymentId);
}

export { formatCountdown };

export default {
  checkout,
  checkPaymentStatus,
  confirmPayment,
  formatCountdown,
};
