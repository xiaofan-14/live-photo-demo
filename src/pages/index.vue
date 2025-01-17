<script setup lang="ts" generic="T extends any, O extends any">
function getFull(uri: string) {
  return new URL(uri, import.meta.url).href
}
</script>

<template>
  <LivePhoto
    :img-src="getFull('../assets/IMG_20250115_162834.jpg')"
    :video-src="getFull('../assets/IMG_20250115_162834.mp4')"
  />
  <LivePhoto
    :img-src="getFull('../assets/IMG_20250115_171107.jpg')"
    :video-src="getFull('../assets/IMG_20250115_171107.mp4')"
  />
  <LivePhoto
    :img-src="getFull('../assets/IMG_20250115_171418.jpg')"
    :video-src="getFull('../assets/IMG_20250115_171418.mp4')"
  />
</template>
