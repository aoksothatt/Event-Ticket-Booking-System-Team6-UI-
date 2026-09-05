<script setup>
import { ref, onMounted } from "vue";
import { getProfile } from "../../api/userApi.js";
import { isAuthenticated } from "../../api/auth.js";
import { useFavorites } from "../../composables/useFavorites.js";
import UserNavbar from "../navbar/UserNavbar.vue";
import Footer from "../common/Footer.vue";
import BackToTop from "../BackToTop.vue";

const user = ref(null);
const favorites = useFavorites();

onMounted(async () => {
  if (!isAuthenticated()) return;
  try {
    const profile = await getProfile();
    user.value = profile?.user || null;
  } catch {
    user.value = null;
  }
  favorites.loadFavorites();
});
</script>

<template>
  <div class="min-h-screen bg-[#0B0D10] text-white">
    <UserNavbar :user="user" />

    <main class="relative">
      <router-view />
    </main>

    <Footer />
    <BackToTop />
  </div>
</template>
