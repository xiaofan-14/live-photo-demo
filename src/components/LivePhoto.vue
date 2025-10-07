<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'

interface Props {
  imgSrc: string
  videoSrc: string
}

const props = defineProps<Props>()

const canvasRef = ref<HTMLCanvasElement | null>(null)
const video = document.createElement('video')
video.crossOrigin = 'anonymous'
video.playsInline = true
video.preload = 'auto'
video.style.display = 'none'

const ctx = ref<CanvasRenderingContext2D | null>(null)
const img = new Image()
img.crossOrigin = 'anonymous'

const isPlaying = ref(false)
const hasInteracted = ref(false)
const hoverTimer = ref<number | null>(null)
const longPressTimer = ref<number | null>(null)
const isTouch = ref(false)

let animFrameId: number | null = null

// ---------- 初始化 ----------
onMounted(async () => {
  const canvas = canvasRef.value
  if (!canvas)
    return
  ctx.value = canvas.getContext('2d')

  // 加载封面图
  img.src = props.imgSrc
  await new Promise(resolve => (img.onload = resolve))
  canvas.width = img.width
  canvas.height = img.height
  drawImage()

  // 加载视频
  video.src = props.videoSrc
  video.addEventListener('ended', stopVideo)

  // 用户首次交互后允许声音播放
  document.addEventListener('click', enableSound, { once: true })
})

// ---------- 交互 ----------
function enableSound() {
  hasInteracted.value = true
  video.muted = false // 允许有声音播放
}

function startVideo() {
  if (!isTouch.value && hasInteracted.value && !isPlaying.value) {
    hoverTimer.value = window.setTimeout(() => playVideo(), 300)
  }
}

function cancelVideo() {
  if (hoverTimer.value) {
    clearTimeout(hoverTimer.value)
    hoverTimer.value = null
  }
}

function handleTouchStart() {
  isTouch.value = true
  if (hasInteracted.value && !isPlaying.value) {
    longPressTimer.value = window.setTimeout(() => playVideo(), 400)
  }
}

function handleTouchEnd() {
  if (longPressTimer.value) {
    clearTimeout(longPressTimer.value)
    longPressTimer.value = null
  }
}

// ---------- 播放逻辑 ----------
function drawImage(alpha = 1) {
  const c = canvasRef.value
  const context = ctx.value
  if (!context || !c)
    return
  context.globalAlpha = alpha
  context.drawImage(img, 0, 0, c.width, c.height)
  context.globalAlpha = 1
}

function drawFrame() {
  const c = canvasRef.value
  const context = ctx.value
  if (!context || !c)
    return
  if (!isPlaying.value)
    return

  context.drawImage(video, 0, 0, c.width, c.height)
  if (!video.ended) {
    animFrameId = requestAnimationFrame(drawFrame)
  }
  else {
    stopVideo()
  }
}

async function playVideo() {
  if (isPlaying.value)
    return
  isPlaying.value = true

  try {
    await video.play()
  }
  catch (err) {
    console.warn('Autoplay blocked, muting video.', err)
    video.muted = true
    await video.play()
  }

  // 淡入过渡
  fadeTransition(drawImage, 1, 0, 200)
  drawFrame()
}

function stopVideo() {
  if (animFrameId)
    cancelAnimationFrame(animFrameId)
  video.pause()
  video.currentTime = 0
  isPlaying.value = false
  // 淡出回静态图
  fadeTransition(drawImage, 0, 1, 300)
}

// ---------- 动画辅助 ----------
function fadeTransition(
  drawFn: (alpha: number) => void,
  from: number,
  to: number,
  duration: number,
) {
  const start = performance.now()
  function step(now: number) {
    const progress = Math.min((now - start) / duration, 1)
    const alpha = from + (to - from) * progress
    drawFn(alpha)
    if (progress < 1)
      requestAnimationFrame(step)
  }
  requestAnimationFrame(step)
}

// ---------- 生命周期 ----------
onBeforeUnmount(() => {
  if (animFrameId)
    cancelAnimationFrame(animFrameId)
  if (hoverTimer.value)
    clearTimeout(hoverTimer.value)
  if (longPressTimer.value)
    clearTimeout(longPressTimer.value)
  video.removeEventListener('ended', stopVideo)
})
</script>

<template>
  <div
    class="relative inline-block select-none overflow-hidden rounded-2xl shadow-md"
    @mouseenter="startVideo"
    @mouseleave="cancelVideo"
    @touchstart.prevent="handleTouchStart"
    @touchend.prevent="handleTouchEnd"
  >
    <canvas ref="canvasRef" class="block h-auto w-full" />
  </div>
</template>

<style scoped>
canvas {
  transition: opacity 0.3s ease;
  background-color: #000;
}
</style>
