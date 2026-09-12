<script setup>
import { onMounted } from "vue";
import { useAuthStore } from "../../stores/auth.js";
import { useFavorites } from "../../composables/useFavorites.js";
import UserNavbar from "../navbar/UserNavbar.vue";
import Footer from "../common/Footer.vue";
import BackToTop from "../BackToTop.vue";

const auth = useAuthStore();
const favorites = useFavorites();

// Load the customer's favorites once authenticated (the app boot already
// restored the profile into the store, so no extra profile fetch is needed).
onMounted(() => {
  if (auth.isAuthenticated) {
    favorites.loadFavorites();
  }
});
</script>

<template>
  <div class="min-h-screen bg-white dark:bg-[#0B0D10] text-slate-900 dark:text-white">
    <UserNavbar :user="auth.user" />

    <main class="relative">
      <router-view />
    </main>

    <Footer />
    <BackToTop />
  </div>
</template>