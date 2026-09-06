/**
 * Global toast notifications.
 *
 * State lives at module scope so every component shares one toast queue,
 * regardless of where it lives in the component tree. `<ToastHost />`
 * (mounted once in App.vue) renders the queue.
 *
 * Usage:
 *   import { useToast } from "./useToast.js";
 *   const { toast } = useToast();
 *   toast("Booking confirmed!", "success");
 *
 * Or import the bare function where a composable call feels heavy:
 *   import { toast } from "./useToast.js";
 *   toast("Welcome back!", "success");
 */

import { ref } from "vue";

const toasts = ref([]);
let nextId = 0;
const DEFAULT_DURATION = 2800;

function toast(message, type = "success", duration = DEFAULT_DURATION) {
  const entry = { id: ++nextId, message, type };
  toasts.value.push(entry);
  window.setTimeout(() => remove(entry.id), duration);
}

function remove(id) {
  toasts.value = toasts.value.filter((t) => t.id !== id);
}

export function useToast() {
  return { toasts, toast, remove };
}

export { toast };