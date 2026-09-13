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
 *   3. If res.data.deeplink is present, provide a "Pay with Bakong app" link.
 *   4. Show a countdown from res.data.expires_at + amount + currency.
 *   5. Call verifyPayment(paymentId) every ~10-15 s — this is the call that
 *      actually asks Bakong whether the transaction completed and confirms
 *      the booking + issues tickets when paid (idempotent server-side).
 *   6. Stop when the result status is "paid" (all tickets confirmed) or
 *      "expired"/"failed". `getPaymentStatus` only reads local state, so it
 *      is suitable for display, not for the authoritative confirmation.
 *
 * The KHQR string is generated LOCALLY by the Laravel backend (PHP KHQR
 * SDK). The frontend never holds Bakong credentials and never reports a
 * payment as paid — confirmation only happens server-side after Bakong
 * confirms the transaction via the MD5 of the KHQR.
 */

import { get, post } from "./http.js";

/**
 * Start the Bakong checkout: creates a pending Booking+Payment and returns
 * the KHQR payload to render.
 *
 * @param {Object} opts
 * @param {number} opts.event_id
 * @param {Array<{ticket_type_id:number,quantity:number}>} opts.items
 *        One or more ticket lines. All lines are consolidated into ONE
 *        booking + ONE payment + ONE KHQR.
 * @param {number} [opts.booking_id] Optional — reuse an existing pending
 *        booking (retry / refresh) so no duplicate booking is created.
 * @returns {Promise<{success:boolean,data:{booking,payment,qr_payload,md5,deeplink,expires_at,amount,currency,poll_interval_seconds}}>}
 */
export async function createBakongCheckout(opts) {
  const payload = {
    event_id: Number(opts.event_id),
  };

  const items = Array.isArray(opts.items)
    ? opts.items
    : [{ ticket_type_id: opts.ticket_type_id, quantity: opts.quantity }];

  if (items.length > 0) {
    payload.items = items.map((i) => ({
      ticket_type_id: Number(i.ticket_type_id),
      quantity: Number(i.quantity),
    }));
  }

  // Legacy single-ticket shape (kept for older callers).
  if (items.length === 1 && !opts.items) {
    payload.ticket_type_id = items[0].ticket_type_id;
    payload.quantity = items[0].quantity;
    delete payload.items;
  }

  if (opts.booking_id) {
    payload.booking_id = Number(opts.booking_id);
  }

  return post("/checkout", payload);
}

/**
 * Read the payment's LOCAL status. Use for display only — it does not check
 * Bakong. Call `verifyPayment` for the authoritative confirmation.
 * Returns: { status: "pending"|"paid"|"failed"|"expired"|"cancelled",
 *            is_expired, expires_at, paid_at, booking_status }
 * @param {number|string} paymentId
 */
export async function getPaymentStatus(paymentId) {
  return get(`/payments/${paymentId}/status`);
}

/**
 * Ask the backend to verify the payment against Bakong and, if the customer
 * has paid, confirm the booking and issue the tickets. Idempotent — safe to
 * call on a short interval while the QR window is open, and on countdown
 * expiry or when the user taps "I have paid".
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