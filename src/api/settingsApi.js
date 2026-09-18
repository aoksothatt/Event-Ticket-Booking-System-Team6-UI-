/**
 * Settings Module
 * Admin platform settings backed by the Laravel /admin/settings endpoints.
 *
 * GET returns the fully resolved settings (stored + config defaults) grouped
 * by category. PUT accepts { settings: { "group.key": value, ... } } and
 * returns the resolved settings after the update.
 *
 * getPublicSettings() exposes a curated, non-sensitive subset the customer-
 * facing UI needs (branding, booking constraints, maintenance state).
 */
import { get, put } from "./http.js";

export const settingsApi = {
  getSettings() {
    return get("/admin/settings");
  },
  updateSettings(values) {
    return put("/admin/settings", { settings: values });
  },
  getPublicSettings() {
    return get("/settings/public");
  },
};