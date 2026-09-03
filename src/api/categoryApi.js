/**
 * Category API
 * Hits Laravel's `/api/categories` endpoint. The backend returns
 * `{ message, status, data: [...] }`.
 */

import { get, USE_MOCK_FALLBACK, mockData } from "./http.js";

export async function getCategories() {
  try {
    const response = await get("/categories");
    const raw = response?.data ?? response;
    return Array.isArray(raw) ? raw : [];
  } catch (error) {
    if (USE_MOCK_FALLBACK && error.isNetwork) return mockData.categories;
    throw error;
  }
}
