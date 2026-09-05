/**
 * Event API
 * All calls hit Laravel's `/api/events`... endpoints through the shared
 * http client. When the API responds with a Laravel paginator
 * (`{ data: { current_page, data: [], last_page ... } }`) we unwrap it
 * into the plain array before returning so components can treat the
 * result as a simple list.
 */

import { get, post, del, USE_MOCK_FALLBACK, mockData } from "./http.js";

/** Unwrap Laravel paginated responses into a plain event array. */
function unwrapList(response) {
  const payload = response?.data;
  if (Array.isArray(payload)) return { events: payload, meta: response?.meta || null };
  if (payload && Array.isArray(payload.data)) {
    return { events: payload.data, pagination: payload };
  }
  return { events: [], pagination: payload || null };
}

/** Fetch events with optional filters (search, category_id, per_page, page). */
export async function getEvents(params = {}) {
  try {
    const response = await get("/events", {
      search: params.search,
      category_id: params.category_id,
      per_page: params.per_page,
      page: params.page,
    });
    return unwrapList(response);
  } catch (error) {
    if (USE_MOCK_FALLBACK && error.isNetwork) {
      let { events } = unwrapList({ data: mockData.events });
      if (params.category_id) {
        events = events.filter((e) => String(e.category_id) === String(params.category_id));
      }
      if (params.search) events = mockData.searchEvents(params.search);
      return { events, pagination: null };
    }
    throw error;
  }
}

/** Fetch a single event by id. */
export async function getEvent(id) {
  try {
    const response = await get(`/events/${id}`);
    return response?.data;
  } catch (error) {
    if (USE_MOCK_FALLBACK && error.isNetwork) {
      const event = mockData.events.find((e) => String(e.id) === String(id));
      if (!event) throw new Error("Event not found.");
      return event;
    }
    throw error;
  }
}

/**
 * Featured events for the hero carousel.
 * The backend doesn't currently expose a dedicated flag, so we default to
 * the most recently published events with images. Swap the implementation
 * (e.g. `/events?featured=true`) without touching callers.
 */
export async function getFeaturedEvents() {
  try {
    const { events } = await getEvents({ per_page: 5 });
    const withImages = events.filter((e) => (e.images && e.images.length) || e.banner);
    const featured = withImages.length >= 3 ? withImages : events;
    return featured.length ? featured : (await getEvents()).events;
  } catch (error) {
    if (USE_MOCK_FALLBACK && error.isNetwork) return mockData.featuredEvents;
    throw error;
  }
}

/**
 * Trending events for the customer homepage.
 * Admin-driven via `is_trending` — only published, still-active events that
 * the admin manually flagged come back from `/events/trending`.
 */
export async function getTrendingEvents() {
  try {
    const response = await get("/events/trending");
    const payload = response?.data;
    if (Array.isArray(payload)) return payload;
    if (payload && Array.isArray(payload.data)) return payload.data;
    return [];
  } catch (error) {
    if (USE_MOCK_FALLBACK && error.isNetwork) return mockData.trendingEvents;
    throw error;
  }
}

/**
 * Upcoming events, sorted by closest start_date.
 */
export async function getUpcomingEvents() {
  try {
    const { events } = await getEvents({ per_page: 10 });
    const now = new Date();
    return events
      .filter((e) => {
        if (e.status === "cancelled" || e.status === "draft") return false;
        if (!e.start_date) return true;
        return new Date(`${e.start_date}T23:59:59`) >= now;
      })
      .sort((a, b) => new Date(a.start_date) - new Date(b.start_date));
  } catch (error) {
    if (USE_MOCK_FALLBACK && error.isNetwork) return mockData.upcomingEvents;
    throw error;
  }
}

/** Events in a given category. */
export async function getEventsByCategory(categoryId) {
  return getEvents({ category_id: categoryId, per_page: 12 });
}

/** Search endpoint for the navbar suggestion dropdown. */
export async function searchEvents(query) {
  try {
    const { events } = await getEvents({ search: query, per_page: 8 });
    return events;
  } catch (error) {
    if (USE_MOCK_FALLBACK && error.isNetwork) return mockData.searchEvents(query);
    throw error;
  }
}

/**
 * Favorites — scoped to the authenticated user on the backend.
 * `GET /api/user/favorites` returns a plain array of favorited events.
 */
export async function getFavorites() {
  try {
    const response = await get("/user/favorites");
    const payload = response?.data;
    if (Array.isArray(payload)) return payload;
    if (payload && Array.isArray(payload.data)) return payload.data;
    return [];
  } catch (error) {
    if (USE_MOCK_FALLBACK && error.isNetwork) {
      return mockData.trendingEvents.slice(0, 2);
    }
    throw error;
  }
}

/** Add an event to the current user's favorites. */
export async function addFavorite(eventId) {
  const response = await post(`/events/${eventId}/favorite`);
  return response?.data;
}

/** Remove an event from the current user's favorites. */
export async function removeFavorite(eventId) {
  const response = await del(`/events/${eventId}/favorite`);
  return response?.data;
}
