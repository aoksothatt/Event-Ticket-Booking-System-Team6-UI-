<script setup>
import { Ticket, Facebook, Instagram, Send } from "lucide-vue-next";

// TikTok isn't part of lucide, so it gets a tiny inline brand glyph to match
// the same visual weight as the other icons.

// School logo used purely as a subtle background/watermark reference.
import etecLogo from "../../assets/img/Etec.jpg";
</script>

<template>
  <footer
    class="relative overflow-hidden border-t border-white/5 px-4 pb-10 pt-16 sm:px-6 lg:px-8"
  >
    <!-- School logo watermark (background reference only) -->
    <div aria-hidden="true" class="pointer-events-none absolute inset-0">
      <!-- Soft radial glow to help the watermark blend in -->
      <div
        class="absolute -bottom-24 -right-20 h-72 w-72 rounded-full bg-[#FFA500]/5 blur-3xl sm:h-96 sm:w-96"
      ></div>
      <!-- Large, low-opacity school logo bleeding off the right side -->
      <div class="absolute -bottom-10 -right-12 h-56 w-56 sm:-right-14 sm:h-72 sm:w-72 lg:h-80 lg:w-80">
        <img
          :src="etecLogo"
          alt=""
          class="h-full w-full select-none object-contain opacity-[0.05] sm:opacity-[0.08]"
        />
      </div>
    </div>

    <div
      class="relative mx-auto flex w-full max-w-7xl flex-col items-center text-center"
    >
      <!-- Logo -->
      <RouterLink to="/home" class="flex items-center gap-2">
        <span
          class="flex h-8 w-8 items-center justify-center rounded-lg bg-[#FFA500] font-extrabold text-black"
        >
          <Ticket :size="17" />
        </span>
        <span class="text-base font-extrabold tracking-tight text-white"
          >BILIT</span
        >
      </RouterLink>

      <!-- Short description -->
      <p class="mt-3 max-w-[42ch] text-[13px] leading-relaxed text-white/50">
        Discover exciting events, book your tickets, and create unforgettable
        experiences.
      </p>

      <!-- Navigation links -->
      <nav
        class="mt-8 flex flex-wrap items-center justify-center gap-x-7 gap-y-2.5"
        aria-label="Footer"
      >
        <RouterLink
          to="/home"
          class="text-[13px] font-medium text-white/60 transition-colors hover:text-[#FFA500]"
        >
          Home
        </RouterLink>
        <RouterLink
          to="/events"
          class="text-[13px] font-medium text-white/60 transition-colors hover:text-[#FFA500]"
        >
          Events
        </RouterLink>
        <RouterLink
          to="/home"
          class="text-[13px] font-medium text-white/60 transition-colors hover:text-[#FFA500]"
        >
          Trending
        </RouterLink>
        <RouterLink
          to="/favorites"
          class="text-[13px] font-medium text-white/60 transition-colors hover:text-[#FFA500]"
        >
          Favorites
        </RouterLink>
        <RouterLink
          to="/my-tickets"
          class="text-[13px] font-medium text-white/60 transition-colors hover:text-[#FFA500]"
        >
          My Tickets
        </RouterLink>
      </nav>

      <!-- Social icons
      <div class="mt-8 flex items-center gap-4">
        <a
          href="#"
          aria-label="Facebook"
          class="text-white/40 transition-colors hover:text-white"
          @click.prevent
        >
          <Facebook :size="16" />
        </a>
        <a
          href="#"
          aria-label="Instagram"
          class="text-white/40 transition-colors hover:text-white"
          @click.prevent
        >
          <Instagram :size="16" />
        </a>
        <a
          href="#"
          aria-label="Telegram"
          class="text-white/40 transition-colors hover:text-white"
          @click.prevent
        >
          <Send :size="16" />
        </a>
        <a
          href="#"
          aria-label="TikTok"
          class="text-white/40 transition-colors hover:text-white"
          @click.prevent
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="currentColor"
            aria-hidden="true"
          >
            <path
              d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"
            />
          </svg>
        </a>
      </div> -->

      <!-- Divider -->
      <div class="mt-14 w-full border-t border-white/5"></div>

      <!-- Copyright & legal -->
      <div
        class="flex w-full flex-col items-center gap-3 pt-6 text-xs text-white/40 sm:flex-row sm:justify-between"
      >
        <p>© 2026 Event Booking System. Team6.</p>
        <div class="flex items-center gap-5">
          <a
            href="#"
            class="transition-colors hover:text-white/80"
            @click.prevent
          >
            Privacy Policy
          </a>
          <a
            href="#"
            class="transition-colors hover:text-white/80"
            @click.prevent
          >
            Terms &amp; Conditions
          </a>
        </div>
      </div>
    </div>

    <!-- School attribution -->
    <p class="relative mt-4 text-center text-[10px] tracking-wide text-white/25">
      Developed as a student project at ETEC
    </p>
  </footer>
</template>
