/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{vue,js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        // Global theme color (appearance.primary_color). Backed by CSS custom
        // properties so utilities like bg-primary/10, text-primary,
        // hover:bg-primary-hover, ring-primary … all stay in sync with the
        // admin-configured brand color at runtime.
        primary: "rgb(var(--color-primary-rgb) / <alpha-value>)",
        "primary-hover": "var(--color-primary-hover)",
        "primary-active": "var(--color-primary-active)",
        "primary-accent": "var(--color-primary-accent)",
        "primary-contrast": "var(--color-primary-contrast)",
      },
    },
  },
  plugins: [],
};

