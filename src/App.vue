<script setup>
import { computed } from "vue";
import { useRoute } from "vue-router";
import Sidebar from "./components/admin/Sidebar.vue";

const route = useRoute();
const isAuthPage = computed(() => route.meta.layout === "auth");
</script>

<template>
  <div v-if="!isAuthPage" class="flex min-h-screen bg-[#0B0B0C]">
    <Sidebar />
    <div class="flex-1 min-w-0">
      <router-view />
    </div>
  </div>
  <router-view v-else />
</template>