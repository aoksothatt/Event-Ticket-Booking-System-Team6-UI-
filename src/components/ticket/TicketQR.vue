<script setup>
/**
 * Client-side QR code renderer for tickets. Encodes the raw value with the
 * `qrcode` package so a QR always renders even without internet access to an
 * external QR API. For event check-in the parent passes a self-check-in URL
 * (`/check-in?ticket=<token>`), which both the admin scanner and the
 * customer's own check-in page understand.
 */
import { onMounted, ref, watch } from "vue";
import QRCode from "qrcode";

const props = defineProps({
  value: { type: String, required: true },
  size: { type: Number, default: 160 },
});

const dataUrl = ref("");
const failed = ref(false);

async function render() {
  const text = String(props.value || "").trim();
  if (!text) {
    dataUrl.value = "";
    return;
  }
  try {
    failed.value = false;
    dataUrl.value = await QRCode.toDataURL(text, {
      width: props.size,
      margin: 1,
      errorCorrectionLevel: "M",
      color: { dark: "#000000", light: "#ffffff" },
    });
  } catch (e) {
    failed.value = true;
  }
}

onMounted(render);
watch(() => props.value, render);
</script>

<template>
  <span class="inline-flex shrink-0 overflow-hidden rounded-lg bg-white p-1.5">
    <img
      v-if="dataUrl"
      :src="dataUrl"
      :alt="'Ticket QR code'"
      :width="size"
      :height="size"
      class="h-24 w-24 object-contain sm:h-28 sm:w-28"
    />
    <span
      v-else
      class="flex h-24 w-24 items-center justify-center bg-slate-200 text-[10px] font-semibold text-slate-500 sm:h-28 sm:w-28"
      :class="{ 'italic text-red-500': failed }"
    >
      {{ failed ? "QR failed" : "..." }}
    </span>
  </span>
</template>