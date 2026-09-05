import { createRouter, createWebHistory } from "vue-router";
// Auth helpers: check JWT presence and the user's role
import { isAuthenticated, isAdmin } from "../api/auth.js";

/**
 * Routes visitors to their default landing page based on role.
 * Admins/organizers → admin dashboard; everyone else → customer home.
 */
function defaultHome() {
  return isAdmin() ? "/admin/overview" : "/home";
}

const routes = [
  {
    path: "/",
    redirect: () => defaultHome(),
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
 * Route guard — runs before every navigation.
 * - Unauthenticated users are sent to /login for protected routes.
 * - Non-admin roles are kept out of /admin/* routes.
 * - Authenticated users cannot visit auth pages (login/register/forgot).
 */
router.beforeEach((to) => {
  const needsAuth = to.meta.requiresAuth === true;

  if (needsAuth && !isAuthenticated()) {
    return { name: "login", query: { redirect: to.fullPath } };
  }

  // Admin area is restricted to admin/organizer roles only.
  if (to.path.startsWith("/admin") && !isAdmin()) {
    return { path: "/home" };
  }

  if (to.meta.layout === "auth") {
    if (isAuthenticated()) {
      return { path: to.path.startsWith("/admin") ? "/admin/overview" : defaultHome() };
    }
  }

  return true;
});

export default router;
