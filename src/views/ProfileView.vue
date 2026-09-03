<script setup>
import { computed, onMounted, ref } from "vue";
import { Mail, Phone, User, CalendarDays, MapPin } from "lucide-vue-next";
import { getProfile } from "../api/userApi.js";
import { STORAGE_BASE } from "../api/http.js";
import { formatPrice } from "../utils/event.js";
import { getMyTickets } from "../api/bookingApi.js";

const loading = ref(true);
const error = ref("");
const profile = ref(null);
const tickets = ref([]);

const user = computed(() => profile.value?.user || null);
const profileData = computed(() => profile.value?.profile || null);

const initials = computed(() => {
  const name = String(user.value?.name || "U");
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] || "") + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase();
});

const avatarUrl = computed(() => {
  const avatar = user.value?.avatar;
  if (!avatar) return null;
  return avatar.startsWith("http") || avatar.startsWith("/") ? avatar : `${STORAGE_BASE}/${avatar}`;
});

const totalTickets = computed(() => tickets.value.length);
const totalSpent = computed(() =>
  tickets.value.reduce((sum, t) => sum + Number(t.total_amount || 0), 0)
);

const roleLabel = computed(() => {
  const role = user.value?.role;
  if (!role) return "Member";
  return role.charAt(0).toUpperCase() + role.slice(1);
});

const statCards = computed(() => [
  { label: "Tickets", value: String(totalTickets.value) },
  { label: "Total spent", value: formatPrice(totalSpent.value) },
  { label: "Role", value: roleLabel.value },
]);

async function load() {
  loading.value = true;
  error.value = "";
  try {
    profile.value = await getProfile();
    tickets.value = await getMyTickets();
  } catch (e) {
    error.value = e.message || "Could not load your profile.";
  } finally {
    loading.value = false;
  }
}

onMounted(load);
</script>

<template>
  <div class="px-4 pb-20 pt-28 sm:px-6 lg:px-8">
    <div class="mx-auto w-full max-w-4xl">
      <h1 class="text-2xl font-extrabold tracking-tight text-white sm:text-3xl">My Profile</h1>
      <p class="mt-1 text-sm text-[#9CA3AF]">Your account information.</p>

      <div v-if="loading" class="mt-8 animate-pulse space-y-4">
        <div class="h-44 rounded-2xl bg-[#14171C]"></div>
        <div class="h-32 rounded-2xl bg-[#14171C]"></div>
      </div>

      <div
        v-else-if="error"
        class="mt-8 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-8 text-center text-red-300"
      >
        {{ error }}
      </div>

      <template v-else-if="user">
        <!-- Header card -->
        <div class="mt-8 flex flex-col items-center gap-6 rounded-2xl border border-white/10 bg-[#14171C] p-6 sm:flex-row sm:p-8">
          <span class="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#FFA500] text-3xl font-extrabold text-black">
            <img v-if="avatarUrl" :src="avatarUrl" alt="Avatar" class="h-full w-full object-cover" />
            <template v-else>{{ initials }}</template>
          </span>

          <div class="min-w-0 text-center sm:text-left">
            <h2 class="text-xl font-bold text-white">{{ user.name }}</h2>
            <p class="mt-1 flex items-center justify-center gap-2 text-sm text-[#9CA3AF] sm:justify-start">
              <Mail :size="14" />
              {{ user.email }}
            </p>
            <p v-if="user.phone" class="mt-1 flex items-center justify-center gap-2 text-sm text-[#9CA3AF] sm:justify-start">
              <Phone :size="14" />
              {{ user.phone }}
            </p>
            <span class="mt-3 inline-block rounded-full bg-[#FFA500]/15 px-3 py-1 text-xs font-bold uppercase tracking-wider text-[#FFA500]">
              {{ roleLabel }}
            </span>
          </div>
        </div>

        <!-- Stats -->
        <div class="mt-6 grid grid-cols-3 gap-4">
          <div v-for="stat in statCards" :key="stat.label" class="rounded-2xl border border-white/10 bg-[#14171C] p-4 text-center">
            <p class="text-lg font-extrabold text-[#FFA500]">{{ stat.value }}</p>
            <p class="mt-1 text-xs text-[#9CA3AF]">{{ stat.label }}</p>
          </div>
        </div>

        <!-- Profile details -->
        <div class="mt-6 rounded-2xl border border-white/10 bg-[#14171C] p-6">
          <h3 class="mb-4 text-base font-bold text-white">Details</h3>
          <div class="grid gap-4 sm:grid-cols-2">
            <div v-if="profileData?.gender" class="flex items-center gap-3">
              <User :size="16" class="text-[#FFA500]" />
              <div>
                <p class="text-xs text-[#9CA3AF]">Gender</p>
                <p class="text-sm capitalize text-white">{{ profileData.gender }}</p>
              </div>
            </div>
            <div v-if="profileData?.dob" class="flex items-center gap-3">
              <CalendarDays :size="16" class="text-[#FFA500]" />
              <div>
                <p class="text-xs text-[#9CA3AF]">Date of birth</p>
                <p class="text-sm text-white">{{ profileData.dob }}</p>
              </div>
            </div>
            <div v-if="profileData?.address" class="flex items-center gap-3 sm:col-span-2">
              <MapPin :size="16" class="shrink-0 text-[#FFA500]" />
              <div class="min-w-0">
                <p class="text-xs text-[#9CA3AF]">Address</p>
                <p class="text-sm text-white">{{ profileData.address }}</p>
              </div>
            </div>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>
