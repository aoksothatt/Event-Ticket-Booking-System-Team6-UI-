<script setup>
import { onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { Save, Lock, Loader2, Check, LayoutDashboard } from "lucide-vue-next";
import { getProfile } from "../api/userApi.js";
import { patch, put } from "../api/http.js";
import { isAdmin } from "../api/auth.js";

const router = useRouter();

const loading = ref(true);
const profile = ref(null);

const form = ref({ name: "", email: "", phone: "" });
const passwordForm = ref({ current_password: "", new_password: "", new_password_confirmation: "" });

const savingProfile = ref(false);
const profileMsg = ref("");
const profileError = ref("");

const savingPassword = ref(false);
const passwordMsg = ref("");
const passwordError = ref("");

const user = () => profile.value?.user || null;

async function load() {
  loading.value = true;
  try {
    profile.value = await getProfile();
    const u = user();
    if (u) {
      form.value = {
        name: u.name || "",
        email: u.email || "",
        phone: u.phone || profile.value?.profile?.phone || "",
      };
    }
  } catch {
    /* handled by view-level fallback to stored user */
  } finally {
    loading.value = false;
  }
}

async function updateProfile() {
  savingProfile.value = true;
  profileMsg.value = "";
  profileError.value = "";
  try {
    const response = await patch("/profile", {
      name: form.value.name,
      email: form.value.email,
      phone: form.value.phone,
    });
    profileMsg.value = response?.message || "Profile updated.";
  } catch (e) {
    profileError.value = e.response?.data?.message || e.message || "Could not update profile.";
  } finally {
    savingProfile.value = false;
  }
}

async function updatePassword() {
  savingPassword.value = true;
  passwordMsg.value = "";
  passwordError.value = "";
  try {
    const response = await put("/profile/password", {
      current_password: passwordForm.value.current_password,
      new_password: passwordForm.value.new_password,
      new_password_confirmation: passwordForm.value.new_password_confirmation,
    });
    passwordMsg.value = response?.message || "Password changed.";
    passwordForm.value = {
      current_password: "",
      new_password: "",
      new_password_confirmation: "",
    };
  } catch (e) {
    passwordError.value = e.response?.data?.message || e.message || "Could not change password.";
  } finally {
    savingPassword.value = false;
  }
}

onMounted(load);
</script>

<template>
  <div class="px-4 pb-20 pt-28 sm:px-6 lg:px-8">
    <div class="mx-auto w-full max-w-2xl">
      <h1 class="text-2xl font-extrabold tracking-tight text-white sm:text-3xl">Settings</h1>
      <p class="mt-1 text-sm text-[#9CA3AF]">Manage your account and security.</p>

      <div v-if="isAdmin()" class="mt-6 rounded-2xl border border-amber-500/30 bg-gradient-to-br from-amber-500/15 to-transparent p-5">
        <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 class="text-base font-bold text-white">Admin Workspace</h2>
            <p class="mt-0.5 text-xs text-[#9CA3AF]">You have administrator access. Open the dashboard to manage the platform.</p>
          </div>
          <button
            type="button"
            class="flex items-center justify-center gap-2 rounded-full bg-[#FFA500] px-5 py-2.5 text-sm font-bold text-black transition hover:bg-[#FFB52E]"
            @click="router.push('/admin/overview')"
          >
            <LayoutDashboard :size="16" />
            Go to Dashboard
          </button>
        </div>
      </div>

      <div v-if="loading" class="mt-8 animate-pulse space-y-4">
        <div class="h-52 rounded-2xl bg-[#14171C]"></div>
        <div class="h-52 rounded-2xl bg-[#14171C]"></div>
      </div>

      <div v-else class="mt-8 space-y-6">
        <!-- Profile settings -->
        <section class="rounded-2xl border border-white/10 bg-[#14171C] p-6">
          <h2 class="mb-1 text-base font-bold text-white">Account Information</h2>
          <p class="mb-5 text-xs text-[#9CA3AF]">Update your name, email, and phone.</p>

          <div class="space-y-4">
            <label class="block">
              <span class="mb-1.5 block text-xs font-medium text-[#9CA3AF]">Name</span>
              <input
                v-model="form.name"
                type="text"
                class="w-full rounded-xl border border-white/10 bg-[#1D2229] px-3.5 py-2.5 text-sm text-white placeholder:text-white/30 focus:border-[#FFA500]/60 focus:outline-none"
              />
            </label>
            <label class="block">
              <span class="mb-1.5 block text-xs font-medium text-[#9CA3AF]">Email</span>
              <input
                v-model="form.email"
                type="email"
                class="w-full rounded-xl border border-white/10 bg-[#1D2229] px-3.5 py-2.5 text-sm text-white placeholder:text-white/30 focus:border-[#FFA500]/60 focus:outline-none"
              />
            </label>
            <label class="block">
              <span class="mb-1.5 block text-xs font-medium text-[#9CA3AF]">Phone</span>
              <input
                v-model="form.phone"
                type="tel"
                class="w-full rounded-xl border border-white/10 bg-[#1D2229] px-3.5 py-2.5 text-sm text-white placeholder:text-white/30 focus:border-[#FFA500]/60 focus:outline-none"
              />
            </label>

            <p v-if="profileMsg" class="flex items-center gap-2 rounded-lg bg-emerald-500/10 px-3 py-2 text-xs text-emerald-300">
              <Check :size="14" /> {{ profileMsg }}
            </p>
            <p v-if="profileError" class="rounded-lg bg-red-500/10 px-3 py-2 text-xs text-red-300">
              {{ profileError }}
            </p>

            <button
              type="button"
              :disabled="savingProfile"
              class="flex items-center gap-2 rounded-full bg-[#FFA500] px-5 py-2.5 text-sm font-bold text-black transition hover:bg-[#FFB52E] disabled:opacity-60"
              @click="updateProfile"
            >
              <Loader2 v-if="savingProfile" :size="15" class="animate-spin" />
              <Save v-else :size="15" />
              {{ savingProfile ? "Saving..." : "Save Changes" }}
            </button>
          </div>
        </section>

        <!-- Password settings -->
        <section class="rounded-2xl border border-white/10 bg-[#14171C] p-6">
          <h2 class="mb-1 text-base font-bold text-white">Change Password</h2>
          <p class="mb-5 text-xs text-[#9CA3AF]">Use at least 8 characters with a strong mix.</p>

          <div class="space-y-4">
            <label class="block">
              <span class="mb-1.5 block text-xs font-medium text-[#9CA3AF]">Current password</span>
              <input
                v-model="passwordForm.current_password"
                type="password"
                class="w-full rounded-xl border border-white/10 bg-[#1D2229] px-3.5 py-2.5 text-sm text-white placeholder:text-white/30 focus:border-[#FFA500]/60 focus:outline-none"
              />
            </label>
            <label class="block">
              <span class="mb-1.5 block text-xs font-medium text-[#9CA3AF]">New password</span>
              <input
                v-model="passwordForm.new_password"
                type="password"
                class="w-full rounded-xl border border-white/10 bg-[#1D2229] px-3.5 py-2.5 text-sm text-white placeholder:text-white/30 focus:border-[#FFA500]/60 focus:outline-none"
              />
            </label>
            <label class="block">
              <span class="mb-1.5 block text-xs font-medium text-[#9CA3AF]">Confirm new password</span>
              <input
                v-model="passwordForm.new_password_confirmation"
                type="password"
                class="w-full rounded-xl border border-white/10 bg-[#1D2229] px-3.5 py-2.5 text-sm text-white placeholder:text-white/30 focus:border-[#FFA500]/60 focus:outline-none"
              />
            </label>

            <p v-if="passwordMsg" class="flex items-center gap-2 rounded-lg bg-emerald-500/10 px-3 py-2 text-xs text-emerald-300">
              <Check :size="14" /> {{ passwordMsg }}
            </p>
            <p v-if="passwordError" class="rounded-lg bg-red-500/10 px-3 py-2 text-xs text-red-300">
              {{ passwordError }}
            </p>

            <button
              type="button"
              :disabled="savingPassword"
              class="flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10 disabled:opacity-60"
              @click="updatePassword"
            >
              <Loader2 v-if="savingPassword" :size="15" class="animate-spin" />
              <Lock v-else :size="15" />
              {{ savingPassword ? "Updating..." : "Update Password" }}
            </button>
          </div>
        </section>
      </div>
    </div>
  </div>
</template>
