// live-photo-player.ts
export class LivePhotoPlayer {
  static activeInstance: LivePhotoPlayer | null = null

  canvas: HTMLCanvasElement
  ctx: CanvasRenderingContext2D
  img: HTMLImageElement
  video: HTMLVideoElement
  isPlaying = false
  hasInteracted = false
  isReady = false
  animFrameId: number | null = null
  fadeDuration = 300
  scaleFactor = 1.05

  constructor(options: {
    canvas: HTMLCanvasElement
    imageSrc: string
    videoSrc: string
  }) {
    this.canvas = options.canvas
    this.ctx = this.canvas.getContext('2d')!
    this.img = new Image()
    this.img.crossOrigin = 'anonymous'
    this.img.src = options.imageSrc

    this.video = document.createElement('video')
    this.video.crossOrigin = 'anonymous'
    this.video.playsInline = true
    this.video.preload = 'auto'
    this.video.src = options.videoSrc

    this.setupEvents()
    this.load()
  }

  async load() {
    await Promise.all([
      new Promise(res => (this.img.onload = res)),
      new Promise((res) => {
        this.video.addEventListener('loadeddata', res, { once: true })
      }),
    ])

    // 初始化 canvas 尺寸
    this.canvas.width = this.img.width
    this.canvas.height = this.img.height

    // 先尝试画视频首帧作为封面
    try {
      this.video.currentTime = 0.05
      await new Promise(res =>
        this.video.addEventListener('seeked', res, { once: true }),
      )
      this.ctx.drawImage(this.video, 0, 0, this.canvas.width, this.canvas.height)
    }
    catch {
      this.ctx.drawImage(this.img, 0, 0, this.canvas.width, this.canvas.height)
    }

    this.isReady = true
  }

  setupEvents() {
    document.addEventListener('click', () => {
      this.hasInteracted = true
      this.video.muted = false
    }, { once: true })

    this.video.addEventListener('ended', () => this.stop())
  }

  async play() {
    if (!this.isReady || this.isPlaying)
      return

    // 只允许一个实例播放
    if (LivePhotoPlayer.activeInstance && LivePhotoPlayer.activeInstance !== this) {
      LivePhotoPlayer.activeInstance.stop()
    }
    LivePhotoPlayer.activeInstance = this

    this.isPlaying = true
    this.video.currentTime = 0

    try {
      await this.video.play()
    }
    catch {
      this.video.muted = true
      await this.video.play()
    }

    this.animatePlay()
    this.drawFrame()
  }

  stop() {
    if (!this.isPlaying)
      return
    this.isPlaying = false

    cancelAnimationFrame(this.animFrameId!)
    this.video.pause()
    this.video.currentTime = 0

    this.animateStop()
  }

  drawFrame() {
    if (!this.isPlaying)
      return
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
    this.ctx.drawImage(this.video, 0, 0, this.canvas.width, this.canvas.height)
    this.animFrameId = requestAnimationFrame(() => this.drawFrame())
  }

  animatePlay() {
    const start = performance.now()
    const duration = this.fadeDuration
    const scale = this.scaleFactor
    const animate = (now: number) => {
      const p = Math.min((now - start) / duration, 1)
      const alpha = p
      const scaleVal = 1 + (scale - 1) * p

      this.ctx.save()
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
      this.ctx.globalAlpha = alpha
      this.ctx.translate(
        this.canvas.width / 2,
        this.canvas.height / 2,
      )
      this.ctx.scale(scaleVal, scaleVal)
      this.ctx.drawImage(
        this.video,
        -this.canvas.width / 2,
        -this.canvas.height / 2,
        this.canvas.width,
        this.canvas.height,
      )
      this.ctx.restore()

      if (p < 1 && this.isPlaying)
        requestAnimationFrame(animate)
    }
    requestAnimationFrame(animate)
  }

  animateStop() {
    const start = performance.now()
    const duration = this.fadeDuration
    const scale = this.scaleFactor
    const animate = (now: number) => {
      const p = Math.min((now - start) / duration, 1)
      const alpha = 1 - p
      const scaleVal = scale - (scale - 1) * p

      this.ctx.save()
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
      this.ctx.globalAlpha = alpha
      this.ctx.translate(this.canvas.width / 2, this.canvas.height / 2)
      this.ctx.scale(scaleVal, scaleVal)
      this.ctx.drawImage(this.img, -this.canvas.width / 2, -this.canvas.height / 2, this.canvas.width, this.canvas.height)
      this.ctx.restore()

      if (p < 1)
        requestAnimationFrame(animate)
    }
    requestAnimationFrame(animate)
  }

  destroy() {
    this.stop()
    this.video.remove()
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
  }
}
