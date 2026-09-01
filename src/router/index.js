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

export default router;
