import { createRouter, createWebHistory } from "vue-router";

const routes = [
  {
    path: "/",
    redirect: "/admin/overview",
  },
  {
    path: "/admin",
    redirect: "/admin/overview",
  },
  // 1. view_dashboard
  {
    path: "/admin/overview",
    name: "overview",
    component: () => import("../components/admin/Dashboard.vue"),
    meta: { navKey: "overview", permission: "view_dashboard" },
  },
  // 2. manage_events
  {
    path: "/admin/events",
    name: "events",
    component: () => import("../components/admin/Events.vue"),
    meta: { navKey: "events", permission: "manage_events" },
  },
  {
    path: "/admin/events/:id",
    name: "event-detail",
    component: () => import("../components/admin/EventDetail.vue"),
    meta: { navKey: "events", permission: "manage_events" },
    props: true,
  },
  // 3. manage_categories
  {
    path: "/admin/categories",
    name: "categories",
    component: () => import("../components/admin/Categories.vue"),
    meta: { navKey: "categories", permission: "manage_categories" },
  },
  // 4. manage_venues
  {
    path: "/admin/venues",
    name: "venues",
    component: () => import("../components/admin/Venues.vue"),
    meta: { navKey: "venues", permission: "manage_venues" },
  },
  // 5. manage_ticket_types
  {
    path: "/admin/tickets",
    name: "tickets",
    component: () => import("../components/admin/Tickets.vue"),
    meta: { navKey: "tickets", permission: "manage_ticket_types" },
  },
  // 6. manage_bookings
  {
    path: "/admin/bookings",
    name: "bookings",
    component: () => import("../components/admin/Bookings.vue"),
    meta: { navKey: "bookings", permission: "manage_bookings" },
  },
  // 7. manage_payments
  {
    path: "/admin/payments",
    name: "payments",
    component: () => import("../components/admin/Payments.vue"),
    meta: { navKey: "payments", permission: "manage_payments" },
  },
  // 8. manage_checkins
  {
    path: "/admin/check-ins",
    name: "checkins",
    component: () => import("../components/admin/CheckIns.vue"),
    meta: { navKey: "checkins", permission: "manage_checkins" },
  },
  // 9. manage_reviews
  {
    path: "/admin/reviews",
    name: "reviews",
    component: () => import("../components/admin/Reviews.vue"),
    meta: { navKey: "reviews", permission: "manage_reviews" },
  },
  // 10. manage_organizers
  {
    path: "/admin/organizers",
    name: "organizers",
    component: () => import("../components/admin/Organizers.vue"),
    meta: { navKey: "organizers", permission: "manage_organizers" },
  },
  // 11. manage_users
  {
    path: "/admin/users",
    name: "users",
    component: () => import("../components/admin/Users.vue"),
    meta: { navKey: "users", permission: "manage_users" },
  },
  // Settings
  {
    path: "/admin/settings",
    name: "settings",
    component: () => import("../components/admin/Settings.vue"),
    meta: { navKey: "settings" },
  },
  {
    // catch-all inside the admin section or any unknown route
    path: "/:pathMatch(.*)*",
    redirect: "/admin/overview",
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior() {
    return { top: 0 };
  },
});

export default router;
