import { createApp } from "vue";
import App from "./App.vue";
import router from "./router";
import "./index.css"; // wherever your Tailwind entry stylesheet lives

createApp(App).use(router).mount("#app");
