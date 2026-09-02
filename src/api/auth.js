/**
 * Auth Module
 * Handles all authentication-related operations:
 * - Storing/retrieving JWT token and user data in localStorage
 * - Making API calls to the Laravel backend (register, login, logout)
 * - Providing helper functions to check authentication status
 */

const TOKEN_KEY = "bilit_auth_token";
const USER_KEY = "bilit_auth_user";

// Base URL for all API requests — uses Vite proxy in dev, or VITE_API_BASE env var
const API_BASE = import.meta.env.VITE_API_BASE || "/api";

// Cache the user object in memory so we don't re-parse localStorage on every call
let cachedUser = null;

// ─── Token & User Storage Helpers ───────────────────────────────────────────

/** Returns the stored JWT token, or null if not logged in */
export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

/** Saves the JWT token and user object after successful login/register */
export function setAuth(token, user) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
  cachedUser = user;
}

/** Returns the stored user object (from memory cache or localStorage) */
export function getUser() {
  // Return cached version if available (avoids re-parsing JSON every time)
  if (cachedUser) return cachedUser;
  try {
    cachedUser = JSON.parse(localStorage.getItem(USER_KEY));
  } catch {
    // If JSON is corrupted, treat as logged out
    cachedUser = null;
  }
  return cachedUser;
}

/** Returns true if the user has a stored token (i.e. is logged in) */
export function isAuthenticated() {
  return Boolean(getToken());
}

/** Removes token and user from storage — called on logout or auth failure */
export function clearAuth() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  cachedUser = null;
}

// ─── API Request Helpers ────────────────────────────────────────────────────

/**
 * Handles a fetch response:
 * - Parses the JSON body
 * - If the HTTP status is not OK (4xx/5xx), throws an Error with the
 *   message from the backend (e.g. "Invalid email or password")
 */
async function handleResponse(response) {
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    // Laravel returns validation errors as { message: "..." } or { field: ["error"] }
    const message =
      data?.message ||
      data?.error ||
      (typeof data === "object" && data !== null
        ? Object.values(data).flat().join(" ") || "Request failed"
        : "Request failed");
    const error = new Error(message);
    error.status = response.status;
    throw error;
  }

  return data;
}

/**
 * Core fetch wrapper that:
 * - Prepends the API_BASE to the path (e.g. "/login" → "/api/login")
 * - Automatically attaches the Authorization: Bearer <token> header if logged in
 * - Sets Content-Type to application/json
 */
async function request(path, options = {}) {
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  // Attach JWT token if the user is authenticated
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  return handleResponse(response);
}

// ─── Auth API Functions ─────────────────────────────────────────────────────

/**
 * Logs in a user by sending email + password to POST /api/login
 * On success, stores the token and user, then returns the response data.
 * On failure (wrong credentials), throws an error with the backend message.
 */
export async function login(email, password) {
  const data = await request("/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  setAuth(data.access_token, data.user);
  return data;
}

/**
 * Registers a new user by sending name, email, password, and
 * password_confirmation to POST /api/register.
 * The backend requires "password_confirmation" because the User model
 * uses the "confirmed" validation rule.
 * On success, stores the returned token and user automatically.
 */
export async function register({
  name,
  email,
  password,
  password_confirmation,
}) {
  const data = await request("/register", {
    method: "POST",
    body: JSON.stringify({ name, email, password, password_confirmation }),
  });
  setAuth(data.access_token, data.user);
  return data;
}

/**
 * Password Reset — Step 1: Request an OTP.
 * Sends the user's email to POST /api/otp/send. The backend looks up the
 * account, generates a 6-digit OTP, stores it (hashed, 5 min expiry), and
 * emails it to the user. Returns the email + expiry so the UI can move to
 * the OTP entry step.
 */
export async function sendOtp(email) {
  const data = await request("/otp/send", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
  return data;
}

/**
 * Password Reset — Step 2: Verify the OTP.
 * Sends email + the 6-digit OTP to POST /api/otp/verify. On success the
 * backend returns a temporary `reset_token` (cached for 5 minutes) which
 * is required in the final reset step.
 */
export async function verifyOtp(email, otp) {
  const data = await request("/otp/verify", {
    method: "POST",
    body: JSON.stringify({ email, otp }),
  });
  return data;
}

/**
 * Password Reset — Step 3: Set a new password.
 * Sends the reset_token + new password (and password_confirmation) to
 * POST /api/reset. The backend requires a minimum of 8 characters and a
 * matching confirmation. Returns a success flag/message on completion.
 */
export async function resetPassword({ reset_token, password, password_confirmation }) {
  const data = await request("/reset", {
    method: "POST",
    body: JSON.stringify({ reset_token, password, password_confirmation }),
  });
  return data;
}

/**
 * Logs out the user by calling POST /api/logout (invalidates the JWT on
 * the server side), then clears local storage regardless of whether the
 * API call succeeded (the "finally" block ensures local cleanup happens).
 */
export async function logout() {
  try {
    await request("/logout", { method: "POST" });
  } finally {
    // Always clear local auth state, even if the API call fails
    clearAuth();
  }
}
