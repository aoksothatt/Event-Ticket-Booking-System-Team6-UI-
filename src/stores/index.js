/**
 * Pinia instance.
 *
 * Created in its own module so both `main.js` (registration) and the router
 * (navigation guards) can share the same instance without circular imports.
 */

import { createPinia } from "pinia";

export const pinia = createPinia();