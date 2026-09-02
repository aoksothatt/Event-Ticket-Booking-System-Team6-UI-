import { createRouter, createWebHistory } from "vue-router";
// isAuthenticated checks if a JWT token exists in localStorage
import { isAuthenticated } from "../api/auth.js";

const routes = [
  {
    path: "/",
    redirect: "/login",
  },
  {
    path: "/login",
    name: "login",
    component: () => import("../components/login/login.vue"),
    meta: { layout: "auth" },
  },
  {
    path: "/register",
    name: "register",
    component: () => import("../components/register/register.vue"),
    meta: { layout: "auth" },
  },
  {
    path: "/forgot-password",
    name: "forgot-password",
    component: () => import("../components/auth/ForgotPassword.vue"),
    meta: { layout: "auth" },
  },
  {
    path: "/admin",
    redirect: "/admin/overview",
  },
  {
    path: "/admin/overview",
    name: "overview",
    component: () => import("../components/admin/Dashboard.vue"),
    meta: { navKey: "overview" },
  },
  {
    path: "/admin/events",
    name: "events",
    component: () => import("../components/admin/Events.vue"),
    meta: { navKey: "events" },
  },
  {
    path: "/admin/events/:id",
    name: "event-detail",
    component: () => import("../components/admin/EventDetail.vue"),
    meta: { navKey: "events" },
    props: true,
  },
  {
    path: "/admin/organizers",
    name: "organizers",
    component: () => import("../components/admin/Organizers.vue"),
    meta: { navKey: "organizers" },
  },
  {
    path: "/admin/tickets",
    name: "tickets",
    component: () => import("../components/admin/Tickets.vue"),
    meta: { navKey: "tickets" },
  },
  {
    path: "/admin/users",
    name: "users",
    component: () => import("../components/admin/Users.vue"),
    meta: { navKey: "users" },
  },
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

/**
 * Route guard — runs before every navigation.
 * - Unauthenticated users trying to access /admin/* are sent to /login
 * - Authenticated users trying to access /login or /register are sent to /admin/overview
 */
router.beforeEach((to) => {
  // Admin routes require authentication
  if (to.path.startsWith("/admin") && !isAuthenticated()) {
    return { name: "login" };
  }

  // Authenticated users should not visit login/register
  if (to.meta.layout === "auth" && isAuthenticated()) {
    return { path: "/admin/overview" };
  }

  return true;
});

export default router;
