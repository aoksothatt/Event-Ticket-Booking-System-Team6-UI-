/**
 * Review API
 * Handles customer and admin event reviews and star ratings.
 */

import { get, post, put, del } from "./http.js";

/**
 * Fetch all reviews.
 * @param {Object} params Optional query parameters
 */
export async function getReviews(params = {}) {
  const response = await get("/reviews", params);
  return response?.data || response;
}

/**
 * Fetch the authenticated customer's own reviews (for their dashboard).
 */
export async function getMyReviews() {
  const response = await get("/my/reviews");
  return response?.data || response;
}

/**
 * Fetch reviews filtered for a specific event.
 * @param {number|string} eventId
 */
export async function getEventReviews(eventId) {
  const response = await getReviews();
  const list = Array.isArray(response) ? response : (response?.data || []);
  return list.filter((r) => String(r.event_id) === String(eventId));
}

/**
 * Fetch a single review by ID.
 * @param {number|string} id
 */
export async function getReview(id) {
  const response = await get(`/reviews/${id}`);
  return response?.data || response;
}

/**
 * Create a new review.
 * The backend attributes the review to the authenticated user automatically,
 * so no user_id is sent from the client.
 * @param {Object} data { event_id, rating, comment, status? }
 */
export async function createReview(data) {
  const response = await post("/reviews", {
    event_id: Number(data.event_id),
    rating: Number(data.rating),
    comment: data.comment || "",
    status: data.status || undefined,
  });
  return response?.data || response;
}

/**
 * Update an existing review (rating, comment, status).
 * @param {number|string} id
 * @param {Object} data { rating?, comment?, status? }
 */
export async function updateReview(id, data) {
  const response = await put(`/reviews/${id}`, data);
  return response?.data || response;
}

/**
 * Delete a review.
 * @param {number|string} id
 */
export async function deleteReview(id) {
  const response = await del(`/reviews/${id}`);
  return response?.data || response;
}

export const reviewApi = {
  getReviews,
  getMyReviews,
  getEventReviews,
  getReview,
  createReview,
  updateReview,
  deleteReview,
};

export default reviewApi;
