<script setup>
import { computed } from "vue";
import { useRoute } from "vue-router";
import AdminSidebar from "./components/layout/AdminSidebar.vue";
import CustomerLayout from "./components/layout/CustomerLayout.vue";

const route = useRoute();

const isAuthPage = computed(() => route.meta.layout === "auth");
const isCustomerPage = computed(() => route.meta.customer === true);
</script>

<template>
  <CustomerLayout v-if="isCustomerPage" />

  <div v-else-if="!isAuthPage" class="flex min-h-screen bg-[#0B0B0C]">
    <AdminSidebar />
    <div class="flex-1 min-w-0">
      <router-view />
    </div>
  </div>

  <router-view v-else />
</template>
