import { createRouter, createWebHistory } from "vue-router";
import { useAuthStore } from "../stores/auth.js";
import { pinia } from "../stores/index.js";
import { authGuard, defaultHome } from "../middleware/guards.js";

const routes = [
  {
    // Landing page: show the customer Home (or the admin dashboard for
    // admins) so visitors can browse events without logging in.
    path: "/",
    redirect: () => defaultHome(useAuthStore(pinia)),
  },
  {
    path: "/home",
    name: "home",
    component: () => import("../views/HomeView.vue"),
    meta: { customer: true },
  },
  {
    path: "/events",
    name: "events",
    component: () => import("../views/EventsView.vue"),
    meta: { customer: true },
  },
  {
    path: "/events/:id",
    name: "event-detail",
    component: () => import("../views/EventDetailView.vue"),
    meta: { customer: true },
    props: true,
  },
  {
    path: "/events/:id/booking",
    name: "event-booking",
    component: () => import("../views/BookingView.vue"),
    meta: { customer: true, requiresAuth: true },
  },
  {
    path: "/my-tickets",
    name: "my-tickets",
    component: () => import("../views/MyTicketsView.vue"),
    meta: { customer: true, requiresAuth: true },
  },
  {
    path: "/favorites",
    name: "favorites",
    component: () => import("../views/FavoritesView.vue"),
    meta: { customer: true, requiresAuth: true },
  },
  {
    path: "/profile",
    name: "profile",
    component: () => import("../views/ProfileView.vue"),
    meta: { customer: true, requiresAuth: true },
  },
  {
    path: "/settings",
    name: "customer-settings",
    component: () => import("../views/SettingsView.vue"),
    meta: { customer: true, requiresAuth: true },
  },
  {
    path: "/login",
    name: "login",
    component: () => import("../views/auth/LoginView.vue"),
    meta: { layout: "auth" },
  },
  {
    path: "/register",
    name: "register",
    component: () => import("../views/auth/RegisterView.vue"),
    meta: { layout: "auth" },
  },
  {
    path: "/forgot-password",
    name: "forgot-password",
    component: () => import("../views/auth/ForgotPasswordView.vue"),
    meta: { layout: "auth" },
  },
  {
    // Landing page for the Google OAuth round-trip. Laravel redirects the
    // browser here with `?token=<jwt>` (or `?error=...` on failure).
    // `allowAuthenticated` keeps the auth-layout guard from bouncing the
    // user away before this page has stored the new token.
    path: "/auth/google/callback",
    name: "google-callback",
    component: () => import("../views/auth/GoogleCallbackView.vue"),
    meta: { layout: "auth", allowAuthenticated: true },
  },
  {
    path: "/admin",
    redirect: "/admin/overview",
  },
  // Admin: overview / dashboard
  {
    path: "/admin/overview",
    name: "overview",
    component: () => import("../views/admin/AdminDashboard.vue"),
    meta: { navKey: "overview", requiresAuth: true, permission: "view_dashboard" },
  },
  // Admin: events
  {
    path: "/admin/events",
    name: "admin-events",
    component: () => import("../views/admin/AdminEvents.vue"),
    meta: { navKey: "events", requiresAuth: true, permission: "manage_events" },
  },
  {
    path: "/admin/events/:id",
    name: "admin-event-detail",
    component: () => import("../views/admin/AdminEventDetail.vue"),
    meta: { navKey: "events", requiresAuth: true, permission: "manage_events" },
    props: true,
  },
  // Admin: categories
  {
    path: "/admin/categories",
    name: "categories",
    component: () => import("../views/admin/Categories.vue"),
    meta: { navKey: "categories", requiresAuth: true, permission: "manage_categories" },
  },
  // Admin: venues
  {
    path: "/admin/venues",
    name: "venues",
    component: () => import("../views/admin/Venues.vue"),
    meta: { navKey: "venues", requiresAuth: true, permission: "manage_venues" },
  },
  // Admin: ticket types
  {
    path: "/admin/tickets",
    name: "admin-tickets",
    component: () => import("../views/admin/AdminTickets.vue"),
    meta: { navKey: "tickets", requiresAuth: true, permission: "manage_ticket_types" },
  },
  // Admin: actual customer tickets
  {
    path: "/admin/customer-tickets",
    name: "admin-customer-tickets",
    component: () => import("../views/admin/AdminCustomerTickets.vue"),
    meta: { navKey: "customer-tickets", requiresAuth: true, permission: "manage_tickets" },
  },
  // Admin: bookings
  {
    path: "/admin/bookings",
    name: "bookings",
    component: () => import("../views/admin/Bookings.vue"),
    meta: { navKey: "bookings", requiresAuth: true, permission: "manage_bookings" },
  },
  // Admin: payments
  {
    path: "/admin/payments",
    name: "payments",
    component: () => import("../views/admin/Payments.vue"),
    meta: { navKey: "payments", requiresAuth: true, permission: "manage_payments" },
  },
  // Admin: check-ins
  {
    path: "/admin/check-ins",
    name: "checkins",
    component: () => import("../views/admin/CheckIns.vue"),
    meta: { navKey: "checkins", requiresAuth: true, permission: "manage_checkins" },
  },
  // Admin: reviews
  {
    path: "/admin/reviews",
    name: "reviews",
    component: () => import("../views/admin/Reviews.vue"),
    meta: { navKey: "reviews", requiresAuth: true, permission: "manage_reviews" },
  },
  // Admin: organizers
  {
    path: "/admin/organizers",
    name: "organizers",
    component: () => import("../views/admin/AdminOrganizers.vue"),
    meta: { navKey: "organizers", requiresAuth: true, permission: "manage_organizers" },
  },
  // Admin: users
  {
    path: "/admin/users",
    name: "admin-users",
    component: () => import("../views/admin/AdminUsers.vue"),
    meta: { navKey: "users", requiresAuth: true, permission: "manage_users" },
  },
  // Admin: settings
  {
    path: "/admin/settings",
    name: "admin-settings",
    component: () => import("../views/admin/AdminSettings.vue"),
    meta: { navKey: "settings", requiresAuth: true },
  },
  {
    // catch-all for any unknown route
    path: "/:pathMatch(.*)*",
    redirect: "/home",
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior() {
    return { top: 0 };
  },
});

/**
 * Navigation guard — rules live in src/middleware/guards.js.
 */
router.beforeEach(authGuard);

export default router;
