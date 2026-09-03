<script setup>
import { ref, onMounted } from "vue";
import { Ticket as TicketIcon } from "lucide-vue-next";
import { getProfile } from "../../api/userApi.js";
import UserNavbar from "../navbar/UserNavbar.vue";

const user = ref(null);

onMounted(async () => {
  try {
    const profile = await getProfile();
    user.value = profile?.user || null;
  } catch {
    user.value = null;
  }
});
</script>

<template>
  <div class="min-h-screen bg-[#0B0D10] text-white">
    <UserNavbar :user="user" />

    <main class="relative">
      <router-view />
    </main>

    <footer class="border-t border-white/5 px-6 py-10">
      <div class="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 sm:flex-row">
        <div class="flex items-center gap-2">
          <span class="flex h-7 w-7 items-center justify-center rounded-md bg-[#FFA500] text-black">
            <TicketIcon :size="15" />
          </span>
          <span class="text-sm font-extrabold tracking-tight">BILIT</span>
        </div>
        <p class="text-xs text-[#9CA3AF]">
          Discover and book the best events near you.
        </p>
      </div>
    </footer>
  </div>
</template>
