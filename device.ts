// Можливості пристрою: тактильний відгук, трусіння, встановлення PWA.
import { getState } from './store'

let hapticLabel: HTMLLabelElement | null = null

function iosTick() {
  // Safari на iOS 18+ дає легкий тактильний відгук при перемиканні <input type="checkbox" switch>.
  if (!hapticLabel) {
    const label = document.createElement('label')
    label.setAttribute('aria-hidden', 'true')
    label.style.cssText =
      'position:fixed;left:-200px;top:0;width:1px;height:1px;opacity:0;pointer-events:none;overflow:hidden'
    const input = document.createElement('input')
    input.type = 'checkbox'
    input.setAttribute('switch', '')
    input.tabIndex = -1
    label.appendChild(input)
    document.body.appendChild(label)
    hapticLabel = label
  }
  hapticLabel.click()
}

export type HapticKind = 'light' | 'medium' | 'strong' | 'hug'

/** Делікатна вібрація, якщо пристрій це підтримує. */
export function haptic(kind: HapticKind = 'light') {
  if (!getState().settings.haptics) return
  const nav = navigator as Navigator & { vibrate?: (p: number | number[]) => boolean }
  if (typeof nav.vibrate === 'function') {
    const pattern: Record<HapticKind, number | number[]> = {
      light: 12,
      medium: 25,
      strong: [30, 40, 30],
      hug: [40, 80, 40, 80, 60],
    }
    try {
      nav.vibrate(pattern[kind])
    } catch {
      /* ігноруємо */
    }
    return
  }
  if (isIOS()) {
    try {
      iosTick()
      if (kind === 'strong' || kind === 'hug') setTimeout(iosTick, 140)
    } catch {
      /* ігноруємо */
    }
  }
}

export function isIOS(): boolean {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
}

export function isStandalone(): boolean {
  return (
    (typeof matchMedia === 'function' && matchMedia('(display-mode: standalone)').matches) ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  )
}

// ---------- Трусіння телефона ----------
type MotionPermissionAPI = { requestPermission?: () => Promise<'granted' | 'denied'> }

export function shakeSupported(): boolean {
  return typeof window !== 'undefined' && 'DeviceMotionEvent' in window
}

export function shakeNeedsPermission(): boolean {
  const DME = (window as unknown as { DeviceMotionEvent?: MotionPermissionAPI }).DeviceMotionEvent
  return !!DME && typeof DME.requestPermission === 'function'
}

/** Запит дозволу (на iOS — лише з обробника дотику). */
export async function requestShakePermission(): Promise<'granted' | 'denied' | 'unsupported'> {
  if (!shakeSupported()) return 'unsupported'
  const DME = (window as unknown as { DeviceMotionEvent?: MotionPermissionAPI }).DeviceMotionEvent
  if (DME && typeof DME.requestPermission === 'function') {
    try {
      const r = await DME.requestPermission()
      motionGranted = r === 'granted'
      return r
    } catch {
      return 'denied'
    }
  }
  motionGranted = true
  return 'granted'
}

let motionGranted = !shakeNeedsPermissionSafe()
function shakeNeedsPermissionSafe() {
  try {
    return shakeNeedsPermission()
  } catch {
    return false
  }
}
export function motionAllowed() {
  return motionGranted
}

let shakeHandler: ((e: DeviceMotionEvent) => void) | null = null

export function listenShake(cb: () => void): () => void {
  let peaks: number[] = []
  let last = 0
  shakeHandler = (e: DeviceMotionEvent) => {
    let mag = 0
    const a = e.acceleration
    if (a && a.x != null && a.y != null && a.z != null) mag = Math.hypot(a.x, a.y, a.z)
    else {
      const g = e.accelerationIncludingGravity
      if (!g || g.x == null || g.y == null || g.z == null) return
      mag = Math.abs(Math.hypot(g.x, g.y, g.z) - 9.81)
    }
    const now = performance.now()
    if (mag > 14) {
      peaks = peaks.filter((p) => now - p < 900)
      if (!peaks.length || now - peaks[peaks.length - 1] > 120) peaks.push(now)
      if (peaks.length >= 3 && now - last > 2000) {
        last = now
        peaks = []
        cb()
      }
    }
  }
  window.addEventListener('devicemotion', shakeHandler)
  return () => {
    if (shakeHandler) window.removeEventListener('devicemotion', shakeHandler)
    shakeHandler = null
  }
}

/** Попросити браузер не стирати фото й голосові без потреби. */
export function askPersistentStorage() {
  try {
    navigator.storage?.persist?.().catch(() => {})
  } catch {
    /* ігноруємо */
  }
}
