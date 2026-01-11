<template>
  <div class="inline-flex w-[22rem] flex-col gap-2 rounded-2xl border border-white/10 bg-black/35 px-3 py-2 shadow-[0_18px_60px_-30px_rgba(0,0,0,0.9)] backdrop-blur-md">
    <template v-if="isUnlocked">
      <div class="flex items-center justify-between gap-3">
        <UButton
          :icon="isMuted ? 'i-heroicons-speaker-x-mark' : 'i-heroicons-speaker-wave'"
          color="neutral"
          variant="soft"
          size="sm"
          class="rounded-full"
          @click="toggleMute"
        />

        <canvas ref="canvasRef" class="h-7 w-full opacity-90" aria-hidden="true" />
      </div>

      <div class="flex items-center gap-3">
        <div class="w-10 text-right text-[11px] tabular-nums tracking-wider text-white/55">
          {{ volumeUi }}
        </div>
        <input
          v-model.number="volumeUi"
          type="range"
          min="0"
          max="100"
          step="1"
          aria-label="Громкость"
          class="mixer-range h-1.5 w-full cursor-pointer appearance-none rounded-full bg-white/15"
          @input="applyVolume"
        >
      </div>
    </template>

    <audio ref="audioRef" loop preload="auto">
      <source
        src="/music.mp3"
        type="audio/mpeg"
      />
      Your browser does not support the audio element.
    </audio>
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, ref, watch } from 'vue'

const audioRef = ref<HTMLAudioElement | null>(null)
const canvasRef = ref<HTMLCanvasElement | null>(null)
const isUnlocked = ref(false)
const isMuted = ref(false)
const volumeUi = ref(10)

const startAt = 36

let audioCtx: AudioContext | null = null
let sourceNode: MediaElementAudioSourceNode | null = null
let analyser: AnalyserNode | null = null
let gain: GainNode | null = null
let data: Uint8Array<ArrayBuffer> | null = null
let raf = 0

const seekToStart = async (a: HTMLAudioElement) => {
  if (Number.isFinite(a.duration) && a.duration > startAt) {
    a.currentTime = startAt
    return
  }
  await new Promise<void>((resolve) => {
    const onMeta = () => resolve()
    a.addEventListener('loadedmetadata', onMeta, { once: true })
  })
  if (Number.isFinite(a.duration) && a.duration > startAt) {
    a.currentTime = startAt
  }
}

const applyVolume = () => {
  const v = Math.max(0, Math.min(1, volumeUi.value / 100))
  if (gain) gain.gain.value = isMuted.value ? 0 : v
}

const toggleMute = () => {
  isMuted.value = !isMuted.value
  const v = Math.max(0, Math.min(1, volumeUi.value / 100))
  if (gain) gain.gain.value = isMuted.value ? 0 : v
}

const ensureAudioGraph = (a: HTMLAudioElement) => {
  if (audioCtx && sourceNode && analyser && gain && data) return
  audioCtx = new AudioContext()
  sourceNode = audioCtx.createMediaElementSource(a)
  analyser = audioCtx.createAnalyser()
  gain = audioCtx.createGain()
  analyser.fftSize = 1024
  analyser.smoothingTimeConstant = 0.85
  data = new Uint8Array(analyser.frequencyBinCount) as unknown as Uint8Array<ArrayBuffer>
  sourceNode.connect(analyser)
  analyser.connect(gain)
  gain.connect(audioCtx.destination)
}

const draw = () => {
  raf = 0
  const c = canvasRef.value
  if (!c || !analyser || !data) return

  const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1))
  const w = Math.max(1, Math.floor(c.clientWidth * dpr))
  const h = Math.max(1, Math.floor(c.clientHeight * dpr))
  if (c.width !== w) c.width = w
  if (c.height !== h) c.height = h

  const ctx = c.getContext('2d')
  if (!ctx) return

  analyser.getByteFrequencyData(data)
  ctx.clearRect(0, 0, w, h)

  const bars = 22
  const gap = Math.max(1, Math.floor(w * 0.008))
  const bw = Math.max(2, Math.floor((w - gap * (bars - 1)) / bars))
  const startBin = 3
  const endBin = Math.min(data.length - 1, 120)
  const binsPerBar = Math.max(1, Math.floor((endBin - startBin) / bars))
  const base = isMuted.value ? 'rgba(255,255,255,0.20)' : 'rgba(255,255,255,0.72)'
  const noiseFloor = 18

  for (let i = 0; i < bars; i++) {
    let sum = 0
    const from = startBin + i * binsPerBar
    const to = Math.min(endBin, from + binsPerBar)
    for (let b = from; b < to; b++) sum += data[b] || 0
    const avg = sum / Math.max(1, to - from)
    const amp = Math.max(0, Math.min(1, (avg - noiseFloor) / (255 - noiseFloor)))
    const barH = Math.max(1, Math.floor(h * amp))

    const x = i * (bw + gap)
    const y = h - barH

    ctx.fillStyle = base
    ctx.fillRect(x, y, bw, barH)
  }

  raf = requestAnimationFrame(draw)
}

const startViz = () => {
  if (!raf) raf = requestAnimationFrame(draw)
}

const stopViz = () => {
  if (raf) cancelAnimationFrame(raf)
  raf = 0
}

const unlockAndPlay = async () => {
  const a = audioRef.value
  if (!a) return
  try {
    ensureAudioGraph(a)
    await audioCtx?.resume()
    await seekToStart(a)
    await a.play()
    isUnlocked.value = true
    applyVolume()
    startViz()
  } catch {
    isUnlocked.value = false
  }
}

watch(isUnlocked, (v) => {
  if (!v) stopViz()
})

onBeforeUnmount(() => {
  stopViz()
  try {
    sourceNode?.disconnect()
    analyser?.disconnect()
    gain?.disconnect()
    void audioCtx?.close()
  } catch {
  } finally {
    sourceNode = null
    analyser = null
    gain = null
    data = null
    audioCtx = null
  }
})

defineExpose({ unlockAndPlay })
</script>
