<script setup>
/**
 * Reusable camera QR-code scanner powered by the html5-qrcode library.
 *
 * Responsibilities:
 *  - camera permission + initialization (desktop webcam & mobile rear camera)
 *  - QR detection and continuous scanning with a center scan-frame overlay
 *  - graceful error handling (permission denied, no camera, HTTPS required,
 *    camera already in use, initialization failure) with a "Try again" action
 *  - graceful stop: unmount, modal close, successful scan, or explicit stop()
 *  - manual ticket-code entry kept as a fallback below the camera
 *
 * Emits:
 *  - `scan`  (raw scanned/manually-entered value) once per ticket
 *  - `camera-state` ("scanning" | "error" | "stopped") for parents that need it
 */
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import {
  Keyboard,
  Loader2,
  QrCode,
  RefreshCw,
  SwitchCamera,
  VideoOff,
} from "lucide-vue-next";
import { Html5Qrcode } from "html5-qrcode";

const emit = defineEmits(["scan", "camera-state"]);

const props = defineProps({
  formats: { type: Array, default: () => ["QR_CODE"] },
  fps: { type: Number, default: 15 },
  qrboxSize: { type: Number, default: 250 },
});

/* Unique container id so multiple scanner instances never collide. */
let instanceId = 0;
const elementId = `qr-scanner-${Date.now()}-${++instanceId}`;

const status = ref("idle"); // idle | starting | scanning | stopped | error
const cameraError = ref("");
const manualCode = ref("");
const cameras = ref([]);
const activeCameraId = ref("");
const viewfinderSize = computed(() => props.qrboxSize);

let html5Qr = null;
let componentEl = null;
let scanInFlight = false;

const isSecureContext =
  typeof window !== "undefined" &&
  (window.isSecureContext || window.location?.hostname === "localhost");

/**
 * html5-qrcode needs to know the rendered element. We grab it by id because
 * the library reads it synchronously when `start()` is called.
 */
function getElement() {
  return document.getElementById(elementId);
}

function cameraSupported() {
  if (typeof window === "undefined") return false;
  if (!("mediaDevices" in navigator) || !("getUserMedia" in navigator.mediaDevices)) {
    cameraError.value =
      "Camera access is unavailable in this browser (no getUserMedia support). Use manual entry below.";
    status.value = "error";
    emit("camera-state", "error");
    return false;
  }
  if (!isSecureContext) {
    cameraError.value =
      "Camera access requires HTTPS (or localhost). Allow camera access or use manual entry below.";
    status.value = "error";
    emit("camera-state", "error");
    return false;
  }
  return true;
}

async function startCamera() {
  componentEl = getElement();
  if (!componentEl || !cameraSupported()) return;

  scanInFlight = false;
  cameraError.value = "";
  status.value = "starting";
  emit("camera-state", "starting");

  try {
    // Request the camera permission here so the browser shows the prompt.
    html5Qr = html5Qr || new Html5Qrcode(elementId, false);

    // Enumerate cameras so we can prefer the rear/environment camera on mobile.
    cameras.value = (await Html5Qrcode.getCameras().catch(() => [])) || [];

    const rearCamera =
      cameras.value.find((c) => /back|rear|environment/i.test(c.label || ""))?.id ||
      "";
    const firstCamera = cameras.value[0]?.id || "";

    const cameraId = rearCamera || firstCamera || "";

    try {
      await html5Qr.start(
        cameraId
          ? { deviceId: { exact: cameraId } }
          : { facingMode: "environment" },
        {
          fps: props.fps,
          qrbox: {
            width: viewfinderSize.value,
            height: viewfinderSize.value,
          },
          aspectRatio: 4 / 3,
        },
        onScanSuccess,
        onScanFailure
      );
      activeCameraId.value = cameraId || "";
    } catch (startErr) {
      // Environment camera may not exist on desktops — fall back to default.
      if (cameraId) {
        await html5Qr.start(
          { facingMode: "environment" },
          {
            fps: props.fps,
            qrbox: { width: viewfinderSize.value, height: viewfinderSize.value },
            aspectRatio: 4 / 3,
          },
          onScanSuccess,
          onScanFailure
        );
        activeCameraId.value = "";
      } else {
        throw startErr;
      }
    }

    status.value = "scanning";
    emit("camera-state", "scanning");
  } catch (e) {
    status.value = "error";
    cameraError.value = describeCameraError(e);
    emit("camera-state", "error");
  }
}

function onScanSuccess(decodedText) {
  if (scanInFlight || status.value !== "scanning") return;
  scanInFlight = true;
  // Stop the camera before handing the value up so nothing keeps running.
  stopScanner();
  emit("scan", decodedText);
}

function onScanFailure() {
  /* every no-match frame is reported; ignore silently */
}

async function switchCamera() {
  if (!html5Qr || status.value !== "scanning" || cameras.value.length < 2) return;

  const idx = cameras.value.findIndex((c) => c.id === activeCameraId.value);
  const next = cameras.value[(idx + 1) % cameras.value.length];
  try {
    await html5Qr.applyVideoConstraints({ deviceId: { exact: next.id } });
    activeCameraId.value = next.id;
  } catch {
    /* constraint switches can fail; keep current camera */
  }
}

function stopScanner() {
  if (!html5Qr) return;
  html5Qr
    .stop()
    .catch(() => {})
    .finally(() => {
      html5Qr?.clear().catch(() => {});
    });
  if (status.value !== "error") status.value = "stopped";
}

function submitManual() {
  if (manualCode.value.trim()) {
    emit("scan", manualCode.value.trim().replace(/\s+/g, ""));
  }
}

function describeCameraError(e) {
  const name = e?.name || "";
  const message = e?.message || "";
  if (name === "NotAllowedError" || message.includes("NotAllowedError")) {
    return "Camera permission denied. Please allow camera access and try again, or enter the code manually below.";
  }
  if (name === "NotFoundError" || name === "OverconstrainedError" || message.includes("NotFoundError")) {
    return "No camera is available on this device. You can enter the ticket code manually below.";
  }
  if (name === "NotReadableError" || message.includes("NotReadableError")) {
    return "Your camera is already in use by another application. Close it and try again, or enter the code manually below.";
  }
  if (!isSecureContext) {
    return "Camera access is unavailable. Please allow camera permission (HTTPS required) or use manual entry below.";
  }
  return "Could not start the camera. Use manual entry below, or try again.";
}

onMounted(() => {
  // Short delay so the container is fully in the DOM before the library reads it.
  requestAnimationFrame(() => startCamera());
});

onBeforeUnmount(() => {
  stopScanner();
});

defineExpose({ startCamera, stopCamera: stopScanner, switchCamera });
</script>

<template>
  <div class="space-y-3">
    <!-- Viewfinder -->
    <div
      class="relative overflow-hidden rounded-xl border border-slate-200 bg-black"
    >
      <div :id="elementId" class="qr-viewport w-full"></div>

      <!-- Scan frame + hint -->
      <div
        v-if="status === 'scanning'"
        class="pointer-events-none absolute inset-0 flex items-center justify-center"
      >
        <div
          class="relative"
          :style="{ width: viewfinderSize + 'px', height: viewfinderSize + 'px' }"
        >
          <span class="absolute -left-0.5 -top-0.5 h-7 w-7 rounded-tl-lg border-l-4 border-t-4 border-amber-500"></span>
          <span class="absolute -right-0.5 -top-0.5 h-7 w-7 rounded-tr-lg border-r-4 border-t-4 border-amber-500"></span>
          <span class="absolute -bottom-0.5 -left-0.5 h-7 w-7 rounded-bl-lg border-b-4 border-l-4 border-amber-500"></span>
          <span class="absolute -bottom-0.5 -right-0.5 h-7 w-7 rounded-br-lg border-b-4 border-r-4 border-amber-500"></span>
        </div>
        <span class="absolute bottom-12 left-1/2 flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-black/60 px-3 py-1 text-[11px] font-medium text-white/90 backdrop-blur">
          <Loader2 :size="12" class="animate-spin text-amber-400" />
          Point your camera at the ticket QR code
        </span>
      </div>

      <!-- Starting -->
      <div
        v-if="status === 'starting' || status === 'idle'"
        class="flex h-64 flex-col items-center justify-center gap-3 text-slate-400"
      >
        <Loader2 :size="26" class="animate-spin text-amber-500" />
        <span class="text-xs font-medium">Starting camera…</span>
      </div>

      <!-- Camera error -->
      <div
        v-else-if="status === 'error' && cameraError"
        class="flex h-64 flex-col items-center justify-center gap-3 bg-slate-950 p-5 text-center"
      >
        <span class="flex h-11 w-11 items-center justify-center rounded-full bg-amber-500/10 text-amber-400">
          <VideoOff :size="20" />
        </span>
        <p class="max-w-xs text-xs font-medium leading-relaxed text-amber-100/90">
          {{ cameraError }}
        </p>
        <div class="flex items-center gap-2">
          <button
            type="button"
            @click="startCamera"
            class="flex items-center gap-1.5 rounded-lg bg-amber-500 px-3.5 py-2 text-xs font-semibold text-slate-950 shadow-sm transition hover:bg-amber-600"
          >
            <RefreshCw :size="13" /> Try camera again
          </button>
        </div>
      </div>

      <!-- Stopped (after successful scan) -->
      <div
        v-else-if="status === 'stopped'"
        class="flex h-64 flex-col items-center justify-center gap-3 bg-slate-950 text-slate-400"
      >
        <svg width="46" height="34" viewBox="0 0 46 34" fill="none" class="opacity-40">
          <rect x="1" y="1" width="18" height="18" rx="2" stroke="#F59E0B" stroke-width="2" fill="none" />
          <rect x="1" y="15" width="18" height="18" rx="2" stroke="#F59E0B" stroke-width="2" fill="none" />
          <rect x="27" y="1" width="18" height="18" rx="2" stroke="#F59E0B" stroke-width="2" fill="none" />
          <rect x="27" y="15" width="18" height="18" rx="2" stroke="#F59E0B" stroke-width="2" fill="none" />
        </svg>
        <span class="flex items-center gap-1.5 text-xs font-medium">
          Camera stopped
        </span>
      </div>
    </div>

    <!-- Scanner controls -->
    <div class="flex items-center justify-between gap-2">
      <p
        v-if="status === 'scanning'"
        class="flex items-center gap-1.5 text-[11px] font-medium text-slate-500"
      >
        <span class="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500"></span>
        Live preview — scanning for a QR code
      </p>
      <p v-else class="text-[11px] font-medium text-slate-400">
        {{ status === "error" ? "Camera unavailable" : status === "stopped" ? "Scan complete" : "&nbsp;" }}
      </p>
      <button
        v-if="status === 'scanning' && cameras.length > 1"
        type="button"
        @click="switchCamera"
        class="flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1.5 text-[11px] font-semibold text-slate-600 transition hover:bg-slate-100"
      >
        <SwitchCamera :size="12" /> Switch camera
      </button>
    </div>

    <!-- Manual entry fallback -->
    <div class="rounded-xl border border-slate-200 bg-slate-50 p-3">
      <label class="mb-1 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-slate-500">
        <Keyboard :size="12" /> Manual entry
      </label>
      <div class="flex gap-2">
        <input
          v-model="manualCode"
          type="text"
          placeholder="Paste QR token or ticket code…"
          @keyup.enter="submitManual"
          class="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 font-mono text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
        />
        <button
          type="button"
          :disabled="!manualCode.trim()"
          @click="submitManual"
          class="flex items-center gap-1.5 rounded-lg bg-amber-500 px-3.5 py-2 text-xs font-semibold text-slate-950 shadow-sm transition hover:bg-amber-600 disabled:opacity-50"
        >
          <QrCode :size="14" /> Lookup
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.qr-viewport {
  min-height: 256px;
  width: 100%;
}

.qr-viewport :deep(video) {
  width: 100%;
  height: 256px;
  object-fit: cover;
}
</style>