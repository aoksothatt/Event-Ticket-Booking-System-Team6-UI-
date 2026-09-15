<script setup>
import { computed, onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import { Save, Lock, Loader2, Check, LayoutDashboard, Camera } from "lucide-vue-next";
import { getProfile } from "../api/userApi.js";
import { patch, put, postFormData, STORAGE_BASE } from "../api/http.js";
import { isAdmin } from "../api/auth.js";

const { t } = useI18n();
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

const avatarInput = ref(null);
const avatarFile = ref(null);
const avatarPreview = ref("");

const user = () => profile.value?.user || null;

const initials = computed(() => {
  const name = String(form.value.name || "U");
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] || "") + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase();
});

const avatarUrl = computed(() => {
  if (avatarPreview.value) return avatarPreview.value;
  const avatar = user()?.avatar;
  if (!avatar) return null;
  return avatar.startsWith("http") || avatar.startsWith("/") ? avatar : `${STORAGE_BASE}/${avatar}`;
});

function onAvatarSelect(e) {
  const file = e.target.files?.[0];
  if (!file) return;
  avatarFile.value = file;
  avatarPreview.value = URL.createObjectURL(file);
  profileError.value = "";
}

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
    avatarFile.value = null;
    avatarPreview.value = "";
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
    if (avatarFile.value) {
      const fd = new FormData();
      fd.append("avatar", avatarFile.value);
      const upload = await postFormData("/profile/avatar", fd);
      if (profile.value) {
        profile.value.user.avatar = upload?.data?.avatar_path;
      }
      avatarFile.value = null;
    }
    const response = await patch("/profile", {
      name: form.value.name,
      email: form.value.email,
      phone: form.value.phone,
    });
    if (profile.value && response?.data?.user) {
      profile.value.user = response.data.user;
    }
    profileMsg.value = response?.message || t('profileUpdated');
  } catch (e) {
    profileError.value = e.response?.data?.message || e.message || t('couldNotUpdateProfile');
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
    passwordMsg.value = response?.message || t('passwordChanged');
    passwordForm.value = {
      current_password: "",
      new_password: "",
      new_password_confirmation: "",
    };
  } catch (e) {
    passwordError.value = e.response?.data?.message || e.message || t('couldNotChangePassword');
  } finally {
    savingPassword.value = false;
  }
}

onMounted(load);
</script>

<template>
  <div class="px-4 pb-20 pt-28 sm:px-6 lg:px-8">
    <div class="mx-auto w-full max-w-2xl">
      <h1 class="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-3xl">{{ t('settings') }}</h1>
      <p class="mt-1 text-sm text-slate-500 dark:text-[#9CA3AF]">{{ t('manageAccountDesc') }}</p>

      <div v-if="isAdmin()" class="mt-6 rounded-2xl border border-amber-500/30 bg-gradient-to-br from-amber-500/15 to-transparent p-5">
        <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 class="text-base font-bold text-slate-900 dark:text-white">{{ t('adminWorkspace') }}</h2>
            <p class="mt-0.5 text-xs text-slate-500 dark:text-[#9CA3AF]">{{ t('adminAccessDesc') }}</p>
          </div>
          <button
            type="button"
            class="flex items-center justify-center gap-2 rounded-full bg-[#FFA500] px-5 py-2.5 text-sm font-bold text-black transition hover:bg-[#FFB52E]"
            @click="router.push('/admin/overview')"
          >
            <LayoutDashboard :size="16" />
            {{ t('goToDashboard') }}
          </button>
        </div>
      </div>

      <div v-if="loading" class="mt-8 animate-pulse space-y-4">
        <div class="h-52 rounded-2xl bg-white dark:bg-[#14171C]"></div>
        <div class="h-52 rounded-2xl bg-white dark:bg-[#14171C]"></div>
      </div>

      <div v-else class="mt-8 space-y-6">
        <!-- Profile settings -->
        <section class="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#14171C] p-6">
          <h2 class="mb-1 text-base font-bold text-slate-900 dark:text-white">{{ t('accountInformation') }}</h2>
          <p class="mb-5 text-xs text-slate-500 dark:text-[#9CA3AF]">{{ t('updateAccountDesc') }}</p>

          <div class="space-y-4">
            <div class="flex flex-col items-center gap-4 rounded-xl border border-dashed border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-[#1D2229] p-5 sm:flex-row sm:items-center">
              <button
                type="button"
                class="group relative flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#FFA500] text-2xl font-extrabold text-black transition hover:opacity-90"
                @click="avatarInput?.click()"
              >
                <img v-if="avatarUrl" :src="avatarUrl" :alt="t('avatar')" class="h-full w-full object-cover" />
                <template v-else>{{ initials }}</template>
                <span class="absolute inset-0 flex items-center justify-center bg-black/40 text-white opacity-0 transition group-hover:opacity-100">
                  <Camera :size="20" />
                </span>
              </button>
              <input ref="avatarInput" type="file" accept="image/*" class="hidden" @change="onAvatarSelect" />
              <div class="flex flex-1 flex-col items-center gap-1 text-center sm:items-start sm:text-left">
                <p class="text-sm font-semibold text-slate-900 dark:text-white">{{ t('avatar') }}</p>
                <p class="text-xs text-slate-500 dark:text-[#9CA3AF]">JPEG, PNG or WebP — max 2MB</p>
                <button
                  type="button"
                  class="mt-1 inline-flex items-center gap-1.5 rounded-full border border-slate-200 dark:border-white/15 bg-white dark:bg-white/5 px-4 py-1.5 text-xs font-semibold text-slate-900 dark:text-white transition hover:bg-slate-200 dark:hover:bg-white/10"
                  @click="avatarInput?.click()"
                >
                  <Camera :size="13" />
                  {{ avatarFile ? "Choose another photo" : "Choose photo" }}
                </button>
              </div>
            </div>

            <label class="block">
              <span class="mb-1.5 block text-xs font-medium text-slate-500 dark:text-[#9CA3AF]">{{ t('name') }}</span>
              <input
                v-model="form.name"
                type="text"
                class="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-[#1D2229] px-3.5 py-2.5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-white/30 focus:border-[#FFA500]/60 focus:outline-none"
              />
            </label>
            <label class="block">
              <span class="mb-1.5 block text-xs font-medium text-slate-500 dark:text-[#9CA3AF]">{{ t('email') }}</span>
              <input
                v-model="form.email"
                type="email"
                class="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-[#1D2229] px-3.5 py-2.5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-white/30 focus:border-[#FFA500]/60 focus:outline-none"
              />
            </label>
            <label class="block">
              <span class="mb-1.5 block text-xs font-medium text-slate-500 dark:text-[#9CA3AF]">{{ t('phone') }}</span>
              <input
                v-model="form.phone"
                type="tel"
                class="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-[#1D2229] px-3.5 py-2.5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-white/30 focus:border-[#FFA500]/60 focus:outline-none"
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
              {{ savingProfile ? t('saving') : t('saveChanges') }}
            </button>
          </div>
        </section>

        <!-- Password settings -->
        <section class="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#14171C] p-6">
          <h2 class="mb-1 text-base font-bold text-slate-900 dark:text-white">{{ t('changePassword') }}</h2>
          <p class="mb-5 text-xs text-slate-500 dark:text-[#9CA3AF]">{{ t('passwordStrengthHint') }}</p>

          <div class="space-y-4">
            <label class="block">
              <span class="mb-1.5 block text-xs font-medium text-slate-500 dark:text-[#9CA3AF]">{{ t('currentPassword') }}</span>
              <input
                v-model="passwordForm.current_password"
                type="password"
                class="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-[#1D2229] px-3.5 py-2.5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-white/30 focus:border-[#FFA500]/60 focus:outline-none"
              />
            </label>
            <label class="block">
              <span class="mb-1.5 block text-xs font-medium text-slate-500 dark:text-[#9CA3AF]">{{ t('newPassword') }}</span>
              <input
                v-model="passwordForm.new_password"
                type="password"
                class="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-[#1D2229] px-3.5 py-2.5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-white/30 focus:border-[#FFA500]/60 focus:outline-none"
              />
            </label>
            <label class="block">
              <span class="mb-1.5 block text-xs font-medium text-slate-500 dark:text-[#9CA3AF]">{{ t('confirmNewPassword') }}</span>
              <input
                v-model="passwordForm.new_password_confirmation"
                type="password"
                class="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-[#1D2229] px-3.5 py-2.5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-white/30 focus:border-[#FFA500]/60 focus:outline-none"
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
              class="flex items-center gap-2 rounded-full border border-slate-200 dark:border-white/15 bg-slate-100 dark:bg-white/5 px-5 py-2.5 text-sm font-semibold text-slate-900 dark:text-white transition hover:bg-slate-200 dark:hover:bg-white/10 disabled:opacity-60"
              @click="updatePassword"
            >
              <Loader2 v-if="savingPassword" :size="15" class="animate-spin" />
              <Lock v-else :size="15" />
              {{ savingPassword ? t('updating') : t('updatePassword') }}
            </button>
          </div>
        </section>
      </div>
    </div>
  </div>
</template>
