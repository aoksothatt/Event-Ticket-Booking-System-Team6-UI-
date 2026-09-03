<script setup>
import Sidebar from "./components/admin/Sidebar.vue";
</script>
 
<template>
  <div class="flex min-h-screen bg-slate-50 text-slate-800">
    <Sidebar />
    <div class="flex-1 min-w-0 overflow-y-auto">
      <router-view v-slot="{ Component, route }">
        <component :is="Component" :key="route.fullPath" />
      </router-view>
    </div>
  </div>
</template>