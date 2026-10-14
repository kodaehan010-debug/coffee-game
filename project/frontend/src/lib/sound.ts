// 간단 효과음 (Web Audio, 파일 없음)
let ctx: AudioContext | null = null

export function beep(freq = 660, ms = 80, enabled = true) {
  if (!enabled) return
  try {
    ctx ??= new AudioContext()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.frequency.value = freq
    gain.gain.value = 0.08
    osc.connect(gain).connect(ctx.destination)
    osc.start()
    osc.stop(ctx.currentTime + ms / 1000)
  } catch {
    /* 오디오 미지원 무시 */
  }
}

export const fanfare = (on: boolean) =>
  [523, 659, 784, 1046].forEach((f, i) => setTimeout(() => beep(f, 150, on), i * 140))

export const boom = (on: boolean) => beep(90, 600, on)
