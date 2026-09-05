/**
 * Favorites composable — single shared source of truth for the current
 * user's saved events across the whole app (cards, hero, detail, page).
 *
 * State lives at module scope so every component that calls useFavorites()
 * observes the same data. Toggling is optimistic with rollback on failure.
 */

import { computed, ref } from "vue";
import { useRouter } from "vue-router";
import { isAuthenticated } from "../api/auth.js";
import { getFavorites, addFavorite, removeFavorite } from "../api/eventApi.js";

const favorites = ref([]);
const loading = ref(false);
const error = ref("");
const toast = ref(null);

let toastTimer = null;

const favoriteIds = computed(() => new Set(favorites.value.map((e) => String(e?.id))));

function isFavorite(event) {
  return favoriteIds.value.has(String(event?.id));
}

function showToast(message, type = "success") {
  toast.value = { message, type };
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast.value = null;
  }, 2600);
}

export function useFavorites() {
  const router = useRouter();

  async function loadFavorites() {
    if (!isAuthenticated()) {
      favorites.value = [];
      error.value = "";
      loading.value = false;
      return;
    }
    if (loading.value) return;

    loading.value = true;
    error.value = "";
    try {
      favorites.value = await getFavorites();
    } catch (e) {
      error.value = e.response?.data?.message || e.message || "Unable to load your favorites.";
      favorites.value = [];
    } finally {
      loading.value = false;
    }
  }

  function retry() {
    loading.value = false;
    return loadFavorites();
  }

  async function toggle(event) {
    if (!event || event.id == null) return;

    if (!isAuthenticated()) {
      showToast("Please log in to save events to your Favorites.", "info");
      const redirect = router.currentRoute.value.fullPath;
      router.push({ path: "/login", query: redirect && redirect !== "/" ? { redirect } : {} });
      return;
    }

    const id = String(event.id);

    if (isFavorite(event)) {
      // Optimistic remove
      favorites.value = favorites.value.filter((e) => String(e?.id) !== id);
      showToast("Removed from Favorites");
      try {
        await removeFavorite(event.id);
      } catch (e) {
        // Roll back UI so it never shows a state the API didn't confirm.
        favorites.value = pushUnique(favorites.value, event);
        showToast("Could not remove from Favorites. Please try again.", "error");
      }
    } else {
      // Optimistic add
      favorites.value = pushUnique(favorites.value, event);
      showToast("Added to Favorites");
      try {
        await addFavorite(event.id);
      } catch (e) {
        favorites.value = favorites.value.filter((e) => String(e?.id) !== id);
        showToast("Could not add to Favorites. Please try again.", "error");
      }
    }
  }

  function pushUnique(list, event) {
    const exists = list.some((e) => String(e?.id) === String(event?.id));
    return exists ? list : [...list, event];
  }

  return { favorites, loading, error, toast, isFavorite, loadFavorites, retry, toggle, showToast };
}