<script setup>
import Sidebar from "./components/admin/Sidebar.vue";
</script>
 
<template>
  <div class="flex min-h-screen bg-[#0B0B0C]">
    <Sidebar />
    <router-view v-slot="{ Component, route }">
      <component :is="Component" :key="route.fullPath" />
    </router-view>
  </div>
</template>
 