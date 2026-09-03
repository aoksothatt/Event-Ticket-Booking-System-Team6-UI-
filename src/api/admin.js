/**
 * API service layer mapping to Laravel Backend endpoints
 */

const API_BASE = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000/api";

function getAuthHeader() {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const headers = {
    "Content-Type": "application/json",
    Accept: "application/json",
    ...getAuthHeader(),
    ...options.headers,
  };

  try {
    const response = await fetch(url, { ...options, headers });
    const data = await response.json().catch(() => null);
    if (!response.ok) {
      return { success: false, status: response.status, message: data?.message || "Request failed", data };
    }
    return { success: true, status: response.status, data };
  } catch (error) {
    return { success: false, message: error.message || "Network error", error };
  }
}

export const adminApi = {
  // 1. view_dashboard
  async getDashboardOverview() {
    return request("/events");
  },

  // 2. manage_users
  async getUsers(params = {}) {
    const query = new URLSearchParams(params).toString();
    return request(`/users${query ? `?${query}` : ""}`);
  },
  async getUser(id) {
    return request(`/users/${id}`);
  },
  async createUser(data) {
    return request("/users", { method: "POST", body: JSON.stringify(data) });
  },
  async updateUser(id, data) {
    return request(`/users/${id}`, { method: "PUT", body: JSON.stringify(data) });
  },
  async deleteUser(id) {
    return request(`/users/${id}`, { method: "DELETE" });
  },

  // 3. manage_organizers
  async getOrganizers(params = {}) {
    const query = new URLSearchParams(params).toString();
    return request(`/organizers${query ? `?${query}` : ""}`);
  },
  async getOrganizer(id) {
    return request(`/organizers/${id}`);
  },
  async createOrganizer(data) {
    return request("/organizers", { method: "POST", body: JSON.stringify(data) });
  },
  async updateOrganizer(id, data) {
    return request(`/organizers/${id}`, { method: "PUT", body: JSON.stringify(data) });
  },
  async deleteOrganizer(id) {
    return request(`/organizers/${id}`, { method: "DELETE" });
  },

  // 4. manage_venues
  async getVenues(params = {}) {
    const query = new URLSearchParams(params).toString();
    return request(`/venues${query ? `?${query}` : ""}`);
  },
  async getVenue(id) {
    return request(`/venues/${id}`);
  },
  async createVenue(data) {
    return request("/venues", { method: "POST", body: JSON.stringify(data) });
  },
  async updateVenue(id, data) {
    return request(`/venues/${id}`, { method: "PUT", body: JSON.stringify(data) });
  },
  async deleteVenue(id) {
    return request(`/venues/${id}`, { method: "DELETE" });
  },

  // 5. manage_categories
  async getCategories() {
    return request("/categories");
  },
  async createCategory(data) {
    return request("/categories", { method: "POST", body: JSON.stringify(data) });
  },
  async updateCategory(id, data) {
    return request(`/categories/${id}`, { method: "PUT", body: JSON.stringify(data) });
  },
  async deleteCategory(id) {
    return request(`/categories/${id}`, { method: "DELETE" });
  },

  // 6. manage_events
  async getEvents(params = {}) {
    const query = new URLSearchParams(params).toString();
    return request(`/events${query ? `?${query}` : ""}`);
  },
  async getEvent(id) {
    return request(`/events/${id}`);
  },
  async createEvent(data) {
    return request("/events", { method: "POST", body: JSON.stringify(data) });
  },
  async updateEvent(id, data) {
    return request(`/events/${id}`, { method: "PUT", body: JSON.stringify(data) });
  },
  async deleteEvent(id) {
    return request(`/events/${id}`, { method: "DELETE" });
  },

  // 7. manage_ticket_types
  async getTicketTypes(params = {}) {
    const query = new URLSearchParams(params).toString();
    return request(`/ticket-types${query ? `?${query}` : ""}`);
  },
  async getTicketType(id) {
    return request(`/ticket-types/${id}`);
  },
  async createTicketType(data) {
    return request("/ticket-types", { method: "POST", body: JSON.stringify(data) });
  },
  async updateTicketType(id, data) {
    return request(`/ticket-types/${id}`, { method: "PUT", body: JSON.stringify(data) });
  },
  async deleteTicketType(id) {
    return request(`/ticket-types/${id}`, { method: "DELETE" });
  },

  // 8. manage_bookings
  async getBookings(params = {}) {
    const query = new URLSearchParams(params).toString();
    return request(`/bookings${query ? `?${query}` : ""}`);
  },
  async getBooking(id) {
    return request(`/bookings/${id}`);
  },
  async createBooking(data) {
    return request("/bookings", { method: "POST", body: JSON.stringify(data) });
  },
  async updateBooking(id, data) {
    return request(`/bookings/${id}`, { method: "PUT", body: JSON.stringify(data) });
  },
  async deleteBooking(id) {
    return request(`/bookings/${id}`, { method: "DELETE" });
  },

  // 9. manage_payments
  async getPayments() {
    return request("/payments");
  },
  async createPayment(data) {
    return request("/payments", { method: "POST", body: JSON.stringify(data) });
  },

  // 10. manage_reviews
  async getReviews() {
    return request("/reviews");
  },
  async getReview(id) {
    return request(`/reviews/${id}`);
  },
  async createReview(data) {
    return request("/reviews", { method: "POST", body: JSON.stringify(data) });
  },
  async updateReview(id, data) {
    return request(`/reviews/${id}`, { method: "PUT", body: JSON.stringify(data) });
  },
  async deleteReview(id) {
    return request(`/reviews/${id}`, { method: "DELETE" });
  },

  // 11. manage_checkins
  async getCheckIns() {
    return request("/check-ins");
  },
  async getCheckIn(id) {
    return request(`/check-ins/${id}`);
  },
  async createCheckIn(data) {
    return request("/check-ins", { method: "POST", body: JSON.stringify(data) });
  },
  async updateCheckIn(id, data) {
    return request(`/check-ins/${id}`, { method: "PUT", body: JSON.stringify(data) });
  },
};

export default adminApi;
