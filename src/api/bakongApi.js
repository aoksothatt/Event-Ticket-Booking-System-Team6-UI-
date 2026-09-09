/**
 * Bakong API — KHQR checkout integration
 *
 * Backs the Bakong Open API payment flow exposed by the Laravel backend:
 *
 *   POST /checkout                     → create booking + payment, returns KHQR
 *   GET  /payments/:id/status          → lightweight poll (every 5–10 s)
 *   POST /payments/:id/verify          → force verification (issues tickets)
 *
 * Flow inside a component:
 *   1. const res = await createBakongCheckout({ event_id, ticket_type_id, quantity })
 *   2. Render res.data.qr_payload into a QR image (e.g. `qrcode` or `vue-qrcode`).
 *   3. Show a countdown from res.data.expires_at + amount + currency.
 *   4. Poll getPaymentStatus(res.data.payment.id) every 10 s.
 *   5. On status === "paid" → redirect to the success page with the tickets.
 *   6. When the countdown hits zero → call verifyPayment(id) once, then stop.
 */

import { get, post } from "./http.js";

/**
 * Start the Bakong checkout: creates a pending Booking+Payment and returns
 * the KHQR payload to render.
 * @param {{ event_id:number, ticket_type_id:number, quantity:number }} opts
 * @returns {Promise<{success:boolean,data:{booking,payment,qr_payload,expires_at,amount,currency,poll_interval_seconds}}>}
 */
export async function createBakongCheckout(opts) {
  return post("/checkout", {
    event_id: Number(opts.event_id),
    ticket_type_id: Number(opts.ticket_type_id),
    quantity: Number(opts.quantity),
  });
}

/**
 * Poll the payment status (backend-local). Returns:
 *   { status: "pending"|"paid"|"failed"|"expired"|"cancelled",
 *     is_expired, expires_at, paid_at, booking_status }
 * @param {number|string} paymentId
 */
export async function getPaymentStatus(paymentId) {
  return get(`/payments/${paymentId}/status`);
}

/**
 * Force a verification round against Bakong. Idempotent — safe to call on
 * countdown expiry or when the user taps "I have paid".
 * @param {number|string} paymentId
 */
export async function verifyPayment(paymentId) {
  return post(`/payments/${paymentId}/verify`);
}

/** Format remaining time from an ISO expiry string, e.g. "04:32". */
export function formatCountdown(expiresAtIso, now = Date.now()) {
  const diff = Math.max(0, new Date(expiresAtIso).getTime() - now);
  const s = Math.floor(diff / 1000);
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}

export const bakongApi = {
  createBakongCheckout,
  getPaymentStatus,
  verifyPayment,
  formatCountdown,
};

export default bakongApi;