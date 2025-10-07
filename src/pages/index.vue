<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { LivePhotoPlayer } from '../utils/live-photo-player'

const canvas = ref<HTMLCanvasElement | null>(null)
let player: LivePhotoPlayer | null = null

onMounted(() => {
  player = new LivePhotoPlayer({
    canvas: canvas.value!,
    imageSrc: '/IMG_20250115_162834.jpg',
    videoSrc: '/IMG_20250115_162834.mp4',
  })
  canvas.value?.addEventListener('mouseenter', () => player?.play())
  canvas.value?.addEventListener('mouseleave', () => player?.stop())
})

onBeforeUnmount(() => {
  player?.destroy()
})
</script>

<template>
  <canvas ref="canvas" class="w-100 rounded-xl shadow" />
</template>
