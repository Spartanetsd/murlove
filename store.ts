// Глобальний стан застосунку: налаштування, лічильники, відкриті секрети.
// Усе зберігається лише локально (localStorage) на цьому пристрої.
import { useSyncExternalStore } from 'react'

export type MotionPref = 'auto' | 'calm' | 'full'

export interface Settings {
  sound: boolean
  volume: number // 0..1
  music: boolean
  musicVolume: number // 0..1
  haptics: boolean
  motion: MotionPref
  shake: boolean
  ignoreSilent: boolean
  ourDate: string // 'YYYY-MM-DD' або ''
}

export interface Stats {
  laughs: number
  hugs: number
  gifts: number
  loves: number
  feeds: number
}

export interface AppState {
  settings: Settings
  stats: Stats
  secrets: string[]
  welcomed: boolean
  installTipHidden: boolean
  reasonsRead: number[]
  noteDay: string
  treatySigned: number
}

const KEY = 'murlove.v1'

const DEFAULTS: AppState = {
  settings: {
    sound: true,
    volume: 0.7,
    music: false,
    musicVolume: 0.35,
    haptics: true,
    motion: 'auto',
    shake: false,
    ignoreSilent: true,
    ourDate: '',
  },
  stats: { laughs: 0, hugs: 0, gifts: 0, loves: 0, feeds: 0 },
  secrets: [],
  welcomed: false,
  installTipHidden: false,
  reasonsRead: [],
  noteDay: '',
  treatySigned: 0,
}

function load(): AppState {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return structuredClone(DEFAULTS)
    const data = JSON.parse(raw)
    return {
      ...DEFAULTS,
      ...data,
      settings: { ...DEFAULTS.settings, ...(data.settings || {}) },
      stats: { ...DEFAULTS.stats, ...(data.stats || {}) },
      secrets: Array.isArray(data.secrets) ? data.secrets : [],
      reasonsRead: Array.isArray(data.reasonsRead) ? data.reasonsRead : [],
    }
  } catch {
    return structuredClone(DEFAULTS)
  }
}

let state: AppState = load()
const listeners = new Set<() => void>()

function persist() {
  try {
    localStorage.setItem(KEY, JSON.stringify(state))
  } catch {
    /* приватний режим або переповнене сховище — працюємо без збереження */
  }
}

export function getState(): AppState {
  return state
}

export function subscribe(fn: () => void): () => void {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

export function update(fn: (s: AppState) => AppState) {
  state = fn(state)
  persist()
  listeners.forEach((l) => l())
}

export function setSetting<K extends keyof Settings>(key: K, value: Settings[K]) {
  update((s) => ({ ...s, settings: { ...s.settings, [key]: value } }))
}

export function bump(stat: keyof Stats, by = 1): number {
  let next = 0
  update((s) => {
    next = s.stats[stat] + by
    return { ...s, stats: { ...s.stats, [stat]: next } }
  })
  return next
}

export function useStore<T>(select: (s: AppState) => T): T {
  return useSyncExternalStore(subscribe, () => select(state), () => select(state))
}

// ---------- Події (тости, секрети) ----------
export interface ToastMsg {
  id: number
  text: string
  icon?: string
}
type ToastListener = (t: ToastMsg) => void
const toastListeners = new Set<ToastListener>()
let toastSeq = 1

export function toast(text: string, icon?: string) {
  const t = { id: toastSeq++, text, icon }
  toastListeners.forEach((l) => l(t))
}
export function onToast(fn: ToastListener) {
  toastListeners.add(fn)
  return () => toastListeners.delete(fn)
}

type SecretListener = (id: string) => void
const secretListeners = new Set<SecretListener>()
export function onSecret(fn: SecretListener) {
  secretListeners.add(fn)
  return () => secretListeners.delete(fn)
}

/** Відкриває секрет. Повертає true, якщо його відкрито вперше. */
export function unlockSecret(id: string): boolean {
  if (state.secrets.includes(id)) return false
  update((s) => ({ ...s, secrets: [...s.secrets, id] }))
  secretListeners.forEach((l) => l(id))
  return true
}

// ---------- Менше руху ----------
const mq = typeof matchMedia === 'function' ? matchMedia('(prefers-reduced-motion: reduce)') : null

export function isCalm(): boolean {
  const m = state.settings.motion
  if (m === 'calm') return true
  if (m === 'full') return false
  return !!mq?.matches
}

export function useCalm(): boolean {
  const pref = useStore((s) => s.settings.motion)
  const sys = useSyncExternalStore(
    (cb) => {
      mq?.addEventListener?.('change', cb)
      return () => mq?.removeEventListener?.('change', cb)
    },
    () => !!mq?.matches,
    () => false,
  )
  return pref === 'calm' || (pref === 'auto' && sys)
}

// ---------- «Мішечок» без частих повторів ----------
const BAGS = 'murlove.bags'
function readBags(): Record<string, { left: number[]; last: number }> {
  try {
    return JSON.parse(localStorage.getItem(BAGS) || '{}')
  } catch {
    return {}
  }
}

/** Випадковий індекс 0..n-1; усі елементи з’являються по разу, перш ніж почнеться нове коло. */
export function pick(key: string, n: number): number {
  if (n <= 1) return 0
  const bags = readBags()
  let bag = bags[key]
  if (!bag || !Array.isArray(bag.left) || bag.left.some((i) => i >= n)) bag = { left: [], last: -1 }
  if (bag.left.length === 0) {
    const all = Array.from({ length: n }, (_, i) => i)
    for (let i = all.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[all[i], all[j]] = [all[j], all[i]]
    }
    if (all[all.length - 1] === bag.last) {
      ;[all[0], all[all.length - 1]] = [all[all.length - 1], all[0]]
    }
    bag.left = all
  }
  const idx = bag.left.pop() as number
  bag.last = idx
  bags[key] = bag
  try {
    localStorage.setItem(BAGS, JSON.stringify(bags))
  } catch {
    /* ігноруємо */
  }
  return idx
}

export function rand(a: number, b: number) {
  return a + Math.random() * (b - a)
}
export function choice<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}
