import { createApp } from "vue";
import App from "./App.vue";
import router from "./router";
import i18n from "./locales/i18n.js";
import { pinia } from "./stores";
import { useAuthStore } from "./stores/auth.js";
import { setUnauthorizedHandler } from "./api/http.js";
import "./index.css";

const app = createApp(App);

app.use(pinia);
app.use(router);
app.use(i18n);

const auth = useAuthStore(pinia);

// Invalid / expired JWT received anywhere in the app:
// wipe the local session AND the Pinia state, then send the user (back) to
// the login page, remembering where they were headed. Auth pages are skipped
// so this can never trigger a redirect loop while signing in.
setUnauthorizedHandler(() => {
  auth.clearSession();
  const { path, fullPath, meta } = router.currentRoute.value;
  if (meta.layout !== "auth") {
    router.replace({
      name: "login",
      query: path !== "/" ? { redirect: fullPath } : undefined,
    });
  }
});

// Rehydrate authentication (refresh the profile from the backend) BEFORE the
// first render. This guarantees the route guards never flash the login page
// for a visitor whose JWT is still valid, and never lets a stale session
// through either. The app mounts as soon as the check completes.
auth
  .restoreSession()
  .finally(() => app.mount("#app"));