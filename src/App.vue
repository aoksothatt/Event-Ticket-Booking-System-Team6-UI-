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
<<<<<<< HEAD
</template>
=======
  <h1>hello</h1>
</template>
 
>>>>>>> 0e78e5336e2e809bfae4fad4bf8f2e889ff4914f
