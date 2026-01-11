<template>
  <div ref="root" class="relative min-h-screen overflow-hidden bg-neutral-950 text-white">
    <div class="absolute inset-0" aria-hidden="true">
      <div class="pointer-events-none absolute inset-0 opacity-60 [background:radial-gradient(650px_circle_at_var(--mx,50%)_var(--my,50%),rgba(34,197,94,0.10),transparent_62%)]" />
      <div
        v-for="orb in orbs"
        :key="orb.id"
        :data-orb="orb.id"
        class="absolute -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl opacity-30"
        :class="orb.class"
        :style="{ left: orb.x, top: orb.y }"
      />
      <div class="pointer-events-none absolute inset-0 opacity-[0.04] [background:repeating-linear-gradient(180deg,rgba(255,255,255,0.30)_0px,rgba(255,255,255,0.30)_1px,transparent_2px,transparent_7px)]" />
    </div>

    <button
      v-if="!isEntered"
      type="button"
      class="absolute inset-0 z-20 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      @click="enter"
    >
      <div class="w-full max-w-md px-6 text-center">
        <div class="text-sm tracking-[0.32em] text-white/55">
          CLICK TO ENTER
        </div>
        <div class="mt-3 text-2xl font-semibold tracking-tight text-white/90">
          Нажми в любом месте
        </div>
        <div class="mt-3 text-sm text-white/60">
          Включу атмосферу и покажу карточку
        </div>
      </div>
    </button>

    <div class="relative z-10 mx-auto flex min-h-screen max-w-5xl items-center px-4 py-16">
      <div
        v-if="isEntered"
        ref="card"
        class="mx-auto w-full max-w-2xl rounded-3xl border border-white/10 bg-white/5 p-8 text-center shadow-[0_30px_120px_-40px_rgba(0,0,0,0.85)] backdrop-blur-xl sm:p-10"
      >
        <div class="grid place-items-center gap-8">
          <div class="relative mx-auto">
            <div class="absolute -inset-6 rounded-full bg-gradient-to-r from-white/10 via-white/5 to-white/10 blur-2xl" data-reveal />
            <NuxtImg
              data-reveal
              src="avatar.jpg"
              alt="Avatar"
              class="relative h-28 w-28 rounded-2xl border border-white/15 object-cover shadow-2xl sm:h-32 sm:w-32"
            />
          </div>

          <div class="space-y-5">
            <div class="space-y-2">
              <h1 class="text-4xl font-semibold tracking-tight sm:text-5xl" data-reveal>
                <span class="bg-gradient-to-r from-white via-green-100 to-white bg-clip-text text-transparent">web.marginal</span>
              </h1>
              <p class="text-sm tracking-[0.32em] text-white/55" data-reveal>
                FULLSTACK / WEB / DEVELOPER
              </p>
            </div>
            <div class="flex flex-wrap justify-center gap-3" data-reveal>
              <UButton icon="logos:telegram" size="lg" color="neutral" variant="soft" to="https://t.me/encryrose" target="_blank">
                Telegram
              </UButton>
              <UButton icon="logos:github-icon" size="lg" color="neutral" variant="soft" to="https://github.com/03O3" target="_blank">
                Github
              </UButton>
              <UButton icon="streamline-freehand-color:cursor-highlight-click-1" size="lg" color="neutral" variant="soft" to="https://duza.dev" target="_blank">
                Duza.dev
              </UButton>
            </div>

            <div class="mt-1 flex w-full justify-center" data-reveal>
              <ClientOnly>
                <AudioPlayer ref="audioPlayer" />
              </ClientOnly>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { animate, stagger } from 'animejs'

const root = ref<HTMLElement | null>(null)
const card = ref<HTMLElement | null>(null)
const audioPlayer = ref<{ unlockAndPlay: () => Promise<void> } | null>(null)
const isEntered = ref(false)

const orbs = [
  { id: 'a', x: '18%', y: '22%', class: 'h-[26rem] w-[26rem] bg-green-200/12' },
  { id: 'b', x: '82%', y: '28%', class: 'h-[30rem] w-[30rem] bg-green-300/10' },
  { id: 'c', x: '74%', y: '82%', class: 'h-[28rem] w-[28rem] bg-green-100/10' },
  { id: 'd', x: '22%', y: '78%', class: 'h-[24rem] w-[24rem] bg-lime-100/6' }
]

let raf = 0
let targetTiltX = 0
let targetTiltY = 0

const applyTilt = () => {
  raf = 0
  if (!card.value) return
  card.value.style.transform = `perspective(1000px) rotateX(${targetTiltX}deg) rotateY(${targetTiltY}deg) translateZ(0)`
}

const onMove = (e: PointerEvent) => {
  const el = root.value
  const panel = card.value
  if (!el || !panel) return

  const r = el.getBoundingClientRect()
  const x = e.clientX - r.left
  const y = e.clientY - r.top

  el.style.setProperty('--mx', `${x}px`)
  el.style.setProperty('--my', `${y}px`)

  const pr = panel.getBoundingClientRect()
  const px = (e.clientX - pr.left) / pr.width - 0.5
  const py = (e.clientY - pr.top) / pr.height - 0.5

  targetTiltX = Math.max(-8, Math.min(8, -py * 10))
  targetTiltY = Math.max(-10, Math.min(10, px * 14))

  if (!raf) raf = requestAnimationFrame(applyTilt)
}

const onLeave = () => {
  const el = root.value
  const panel = card.value
  if (!el || !panel) return
  el.style.setProperty('--mx', '50%')
  el.style.setProperty('--my', '50%')
  targetTiltX = 0
  targetTiltY = 0
  if (!raf) raf = requestAnimationFrame(applyTilt)
}

const startReveal = () => {
  animate('[data-reveal]', {
    opacity: [0, 1],
    translateY: [14, 0],
    delay: stagger(90),
    duration: 800,
    ease: 'out(3)'
  })
}

const enter = async () => {
  isEntered.value = true
  await nextTick()
  startReveal()
  await audioPlayer.value?.unlockAndPlay()
}

onMounted(() => {
  const el = root.value
  if (!el) return

  el.addEventListener('pointermove', onMove, { passive: true })
  el.addEventListener('pointerleave', onLeave, { passive: true })

  animate('[data-orb]', {
    translateX: () => (Math.random() * 220 - 110),
    translateY: () => (Math.random() * 220 - 110),
    scale: [0.95, 1.1],
    duration: () => (9000 + Math.random() * 7000),
    delay: stagger(240),
    loop: true,
    alternate: true,
    ease: 'inOut(4)'
  })
})

onBeforeUnmount(() => {
  const el = root.value
  if (!el) return
  el.removeEventListener('pointermove', onMove)
  el.removeEventListener('pointerleave', onLeave)
  if (raf) cancelAnimationFrame(raf)
})
</script>
