/**
 * Auth Module
 * Handles all authentication-related operations:
 * - Storing/retrieving JWT token and user data in localStorage
 * - Making API calls to the Laravel backend (register, login, logout)
 * - Providing helper functions to check authentication status
 */

import http from "./http.js";

const TOKEN_KEY = "bilit_auth_token";
const USER_KEY = "bilit_auth_user";

let cachedUser = null;

// ─── Token & User Storage Helpers ───────────────────────────────────────────

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setAuth(token, user) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
  cachedUser = user;
}

export function getUser() {
  if (cachedUser) return cachedUser;
  try {
    cachedUser = JSON.parse(localStorage.getItem(USER_KEY));
  } catch {
    cachedUser = null;
  }
  return cachedUser;
}

export function isAuthenticated() {
  return Boolean(getToken());
}

export function userRole() {
  const user = getUser();
  return (user?.role || "").toLowerCase() || null;
}

export const ADMIN_ROLES = ["admin", "organizer"];

export function isAdmin() {
  const role = userRole();
  return ADMIN_ROLES.includes(role);
}

export function clearAuth() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  cachedUser = null;
}

// ─── Auth API Functions ─────────────────────────────────────────────────────

export async function login(email, password) {
  const { data } = await http.post("/login", { email, password });
  setAuth(data.access_token, data.user);
  return data;
}

export async function register({ name, email, password, password_confirmation }) {
  const { data } = await http.post("/register", {
    name,
    email,
    password,
    password_confirmation,
  });
  setAuth(data.access_token, data.user);
  return data;
}

export async function sendOtp(email) {
  const { data } = await http.post("/otp/send", { email });
  return data;
}

export async function verifyOtp(email, otp) {
  const { data } = await http.post("/otp/verify", { email, otp });
  return data;
}

export async function resetPassword({ reset_token, password, password_confirmation }) {
  const { data } = await http.post("/reset", {
    reset_token,
    password,
    password_confirmation,
  });
  return data;
}

export async function logout() {
  try {
    await http.post("/logout");
  } finally {
    clearAuth();
  }
}
