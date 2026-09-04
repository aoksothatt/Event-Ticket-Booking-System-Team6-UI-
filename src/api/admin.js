/**
 * Admin API service — uses the shared http.js client so auth tokens
 * and error handling are consistent across the entire application.
 */

import { get, post, put, del, postFormData, putFormData } from "./http.js";

export const adminApi = {
  // 0. Dashboard
  async getDashboard() {
    return get("/admin/dashboard");
  },

  // 1. manage_users
  async getUsers(params = {}) {
    return get("/users", params);
  },
  async getUser(id) {
    return get(`/users/${id}`);
  },
  async createUser(data) {
    return post("/users", data);
  },
  async updateUser(id, data) {
    return put(`/users/${id}`, data);
  },
  async deleteUser(id) {
    return del(`/users/${id}`);
  },

  // 2. manage_organizers
  async getOrganizers(params = {}) {
    return get("/organizers", params);
  },
  async getOrganizer(id) {
    return get(`/organizers/${id}`);
  },
  async createOrganizer(data) {
    return post("/organizers", data);
  },
  async updateOrganizer(id, data) {
    return put(`/organizers/${id}`, data);
  },
  async deleteOrganizer(id) {
    return del(`/organizers/${id}`);
  },

  // 3. manage_venues
  async getVenues(params = {}) {
    return get("/venues", params);
  },
  async getVenue(id) {
    return get(`/venues/${id}`);
  },
  async createVenue(data) {
    return post("/venues", data);
  },
  async updateVenue(id, data) {
    return put(`/venues/${id}`, data);
  },
  async deleteVenue(id) {
    return del(`/venues/${id}`);
  },

  // 4. manage_categories
  async getCategories() {
    return get("/categories");
  },
  async createCategory(data) {
    return post("/categories", data);
  },
  async updateCategory(id, data) {
    return put(`/categories/${id}`, data);
  },
  async deleteCategory(id) {
    return del(`/categories/${id}`);
  },

  // 5. manage_events
  async getEvents(params = {}) {
    return get("/events", params);
  },
  async getEvent(id) {
    return get(`/events/${id}`);
  },
  async createEvent(data) {
    return postFormData("/events", data);
  },
  async updateEvent(id, data) {
    return putFormData(`/events/${id}`, data);
  },
  async deleteEvent(id) {
    return del(`/events/${id}`);
  },

  // 6. manage_ticket_types
  async getTicketTypes(params = {}) {
    return get("/ticket-types", params);
  },
  async getTicketType(id) {
    return get(`/ticket-types/${id}`);
  },
  async createTicketType(data) {
    return post("/ticket-types", data);
  },
  async updateTicketType(id, data) {
    return put(`/ticket-types/${id}`, data);
  },
  async deleteTicketType(id) {
    return del(`/ticket-types/${id}`);
  },

  // 7. manage_bookings
  async getBookings(params = {}) {
    return get("/bookings", params);
  },
  async getBooking(id) {
    return get(`/bookings/${id}`);
  },
  async createBooking(data) {
    return post("/bookings", data);
  },
  async updateBooking(id, data) {
    return put(`/bookings/${id}`, data);
  },
  async deleteBooking(id) {
    return del(`/bookings/${id}`);
  },

  // 8. manage_payments
  async getPayments() {
    return get("/payments");
  },
  async createPayment(data) {
    return post("/payments", data);
  },

  // 9. manage_reviews
  async getReviews() {
    return get("/reviews");
  },
  async getReview(id) {
    return get(`/reviews/${id}`);
  },
  async createReview(data) {
    return post("/reviews", data);
  },
  async updateReview(id, data) {
    return put(`/reviews/${id}`, data);
  },
  async deleteReview(id) {
    return del(`/reviews/${id}`);
  },

  // 10. manage_checkins
  async getCheckIns() {
    return get("/check-ins");
  },
  async getCheckIn(id) {
    return get(`/check-ins/${id}`);
  },
  async createCheckIn(data) {
    return post("/check-ins", data);
  },
  async updateCheckIn(id, data) {
    return put(`/check-ins/${id}`, data);
  },

  // 11. manage_tickets (actual customer tickets, distinct from ticket types)
  async getTickets(params = {}) {
    return get("/tickets", params);
  },
  async getTicket(id) {
    return get(`/tickets/${id}`);
  },
  async verifyTicket(qrToken) {
    return post("/tickets/verify", { qr_token: qrToken });
  },
  async cancelTicket(id) {
    return post(`/tickets/${id}/cancel`);
  },
};

export default adminApi;
