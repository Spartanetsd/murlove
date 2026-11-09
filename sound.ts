// Звуковий рушій «МурLove»: усі звуки синтезуються в реальному часі через Web Audio.
// Жодних сторонніх аудіофайлів — тож немає питань з ліцензіями, а офлайн усе працює.
import { getState, subscribe, rand } from './store'

export type SoundName =
  | 'tap'
  | 'pop'
  | 'chime'
  | 'sparkle'
  | 'kiss'
  | 'kisses'
  | 'meow'
  | 'yip'
  | 'squeak'
  | 'nom'
  | 'boing'
  | 'bowl'
  | 'blup'
  | 'yawn'
  | 'snore'
  | 'hug'
  | 'heartbeat'
  | 'tada'
  | 'whoosh'
  | 'gift'
  | 'giggle'
  | 'purr'

type Ctx = BaseAudioContext
type Synth = (c: Ctx, out: AudioNode, t: number) => void

let ctx: AudioContext | null = null
let master: GainNode | null = null
let sfxBus: GainNode | null = null
let musicBus: GainNode | null = null
let musicGate: GainNode | null = null
let duck: GainNode | null = null
const noiseCache = new WeakMap<Ctx, AudioBuffer>()

function noiseBuffer(c: Ctx): AudioBuffer {
  let b = noiseCache.get(c)
  if (!b) {
    b = c.createBuffer(1, c.sampleRate * 2, c.sampleRate)
    const d = b.getChannelData(0)
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1
    noiseCache.set(c, b)
  }
  return b
}

function applySession() {
  const s = (navigator as unknown as { audioSession?: { type: string } }).audioSession
  if (s) {
    try {
      s.type = getState().settings.ignoreSilent ? 'playback' : 'ambient'
    } catch {
      /* старіші iOS */
    }
  }
}

/** Викликати в обробнику дотику: створює/відновлює AudioContext (вимога iOS). */
export function unlockAudio() {
  if (!ctx) {
    const AC: typeof AudioContext | undefined =
      window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!AC) return
    applySession()
    try {
      ctx = new AC({ latencyHint: 'interactive' })
    } catch {
      return
    }
    const comp = ctx.createDynamicsCompressor()
    comp.threshold.value = -12
    comp.knee.value = 10
    comp.ratio.value = 3.5
    comp.attack.value = 0.004
    comp.release.value = 0.2
    master = ctx.createGain()
    master.gain.value = 0
    master.connect(comp).connect(ctx.destination)
    sfxBus = ctx.createGain()
    sfxBus.connect(master)
    musicBus = ctx.createGain()
    musicGate = ctx.createGain()
    musicGate.gain.value = 0
    duck = ctx.createGain()
    musicBus.connect(musicGate).connect(duck).connect(master)
    applyVolumes(true)
    syncMusic()
  }
  if (ctx.state !== 'running') ctx.resume().catch(() => {})
}

function applyVolumes(instant = false) {
  if (!ctx || !master || !musicBus) return
  const s = getState().settings
  const t = ctx.currentTime
  const target = s.sound ? Math.pow(s.volume, 1.6) : 0
  if (instant) master.gain.setValueAtTime(target, t)
  else master.gain.setTargetAtTime(target, t, 0.06)
  musicBus.gain.setTargetAtTime(Math.pow(s.musicVolume, 1.5) * 0.55, t, 0.1)
}

let lastIgnore = getState().settings.ignoreSilent
subscribe(() => {
  applyVolumes()
  syncMusic()
  const ig = getState().settings.ignoreSilent
  if (ig !== lastIgnore) {
    lastIgnore = ig
    applySession()
  }
})

if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    if (!ctx) return
    if (document.hidden) {
      stopPurr()
      stopHeartbeat()
      ctx.suspend().catch(() => {})
    } else {
      ctx.resume().catch(() => {})
    }
  })
}

function live(): { c: AudioContext; out: AudioNode } | null {
  if (!ctx || !sfxBus || !getState().settings.sound) return null
  if (ctx.state === 'suspended') ctx.resume().catch(() => {})
  return { c: ctx, out: sfxBus }
}

// ---------- Будівельні блоки ----------
function gainNode(c: Ctx, v = 0): GainNode {
  const g = c.createGain()
  g.gain.value = v
  return g
}
function filt(c: Ctx, type: BiquadFilterType, f: number, q = 0.7): BiquadFilterNode {
  const b = c.createBiquadFilter()
  b.type = type
  b.frequency.value = f
  b.Q.value = q
  return b
}
function osc(c: Ctx, type: OscillatorType, f: number): OscillatorNode {
  const o = c.createOscillator()
  o.type = type
  o.frequency.value = f
  return o
}
function noiseSrc(c: Ctx): AudioBufferSourceNode {
  const s = c.createBufferSource()
  s.buffer = noiseBuffer(c)
  s.loop = true
  return s
}
/** Швидка атака, експоненційне згасання. */
function pluck(g: GainNode, t: number, peak: number, attack: number, decay: number) {
  g.gain.setValueAtTime(0.0001, t)
  g.gain.linearRampToValueAtTime(peak, t + attack)
  g.gain.exponentialRampToValueAtTime(0.0001, t + attack + decay)
}
function run(nodes: (OscillatorNode | AudioBufferSourceNode)[], t: number, dur: number) {
  for (const n of nodes) {
    n.start(t, n instanceof AudioBufferSourceNode ? Math.random() * 1.5 : undefined)
    n.stop(t + dur + 0.05)
  }
}

/** Ніжний дзвіночок з негармонійними обертонами. */
function bell(c: Ctx, out: AudioNode, t: number, f: number, peak = 0.25, len = 1.8) {
  const ratios = [1, 2.01, 2.76, 4.07, 5.4]
  const amps = [1, 0.42, 0.28, 0.14, 0.07]
  ratios.forEach((r, i) => {
    const o = osc(c, 'sine', f * r)
    const g = gainNode(c)
    pluck(g, t, peak * amps[i], 0.004, len * (1 - i * 0.16))
    o.connect(g).connect(out)
    run([o], t, len)
  })
}

const PENTA = [1046.5, 1174.7, 1318.5, 1568, 1760, 2093] // C6 D6 E6 G6 A6 C7

// ---------- Звуки ----------
const synths: Record<Exclude<SoundName, 'purr'>, Synth> = {
  tap(c, out, t) {
    const o = osc(c, 'sine', 1500)
    const g = gainNode(c)
    pluck(g, t, 0.07, 0.003, 0.05)
    o.connect(g).connect(out)
    run([o], t, 0.08)
  },

  pop(c, out, t) {
    const o = osc(c, 'sine', 320)
    o.frequency.exponentialRampToValueAtTime(1100, t + 0.06)
    const g = gainNode(c)
    pluck(g, t, 0.35, 0.004, 0.09)
    o.connect(g).connect(out)
    run([o], t, 0.12)
  },

  chime(c, out, t) {
    const f = PENTA[Math.floor(Math.random() * 4)]
    bell(c, out, t, f, 0.22, 2)
    bell(c, out, t + 0.12, f * 1.5, 0.12, 1.6)
  },

  sparkle(c, out, t) {
    const start = Math.floor(rand(0, 2))
    for (let i = 0; i < 7; i++) {
      const f = PENTA[(start + i) % PENTA.length] * (i + start >= PENTA.length ? 2 : 1)
      bell(c, out, t + i * 0.055, f, 0.13 * (1 - i * 0.08), 1.1)
    }
    const n = noiseSrc(c)
    const hp = filt(c, 'highpass', 7000)
    const g = gainNode(c)
    g.gain.setValueAtTime(0.0001, t)
    g.gain.linearRampToValueAtTime(0.035, t + 0.15)
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.8)
    n.connect(hp).connect(g).connect(out)
    run([n], t, 0.85)
  },

  kiss(c, out, t) {
    kissAt(c, out, t, 1)
  },

  kisses(c, out, t) {
    kissAt(c, out, t, 1)
    kissAt(c, out, t + 0.28, 1.12)
    kissAt(c, out, t + 0.52, 0.94)
  },

  meow(c, out, t) {
    const dur = rand(0.62, 0.82)
    const base = rand(600, 760)
    const o = osc(c, 'sawtooth', base * 0.78)
    o.frequency.setValueAtTime(base * 0.78, t)
    o.frequency.linearRampToValueAtTime(base * 1.22, t + dur * 0.32)
    o.frequency.linearRampToValueAtTime(base * 0.8, t + dur)
    const vib = osc(c, 'sine', 6.5)
    const vg = gainNode(c, base * 0.018)
    vib.connect(vg).connect(o.frequency)
    const f1 = filt(c, 'bandpass', 500, 5)
    f1.frequency.setValueAtTime(450, t)
    f1.frequency.linearRampToValueAtTime(1050, t + dur * 0.35)
    f1.frequency.linearRampToValueAtTime(520, t + dur)
    const f2 = filt(c, 'bandpass', 2100, 7)
    f2.frequency.setValueAtTime(2300, t)
    f2.frequency.linearRampToValueAtTime(1500, t + dur * 0.45)
    f2.frequency.linearRampToValueAtTime(950, t + dur)
    const f3 = filt(c, 'bandpass', 3300, 9)
    const g1 = gainNode(c, 2.6)
    const g2 = gainNode(c, 1.6)
    const g3 = gainNode(c, 0.6)
    const env = gainNode(c)
    env.gain.setValueAtTime(0.0001, t)
    env.gain.linearRampToValueAtTime(0.38, t + 0.07)
    env.gain.linearRampToValueAtTime(0.32, t + dur * 0.7)
    env.gain.exponentialRampToValueAtTime(0.0001, t + dur)
    o.connect(f1).connect(g1).connect(env)
    o.connect(f2).connect(g2).connect(env)
    o.connect(f3).connect(g3).connect(env)
    env.connect(out)
    run([o, vib], t, dur)
  },

  yip(c, out, t) {
    const p = rand(0.92, 1.1)
    ;[0, 0.19].forEach((k, i) => {
      const tt = t + k
      const d = 0.17
      const q = p * (i ? 1.06 : 1)
      const o = osc(c, 'sawtooth', 640 * q)
      o.frequency.setValueAtTime(640 * q, tt)
      o.frequency.linearRampToValueAtTime(1080 * q, tt + 0.035)
      o.frequency.exponentialRampToValueAtTime(560 * q, tt + d)
      const fa = filt(c, 'bandpass', 1150, 3)
      const fb = filt(c, 'bandpass', 2600, 5)
      const ga = gainNode(c, 2.2)
      const gb = gainNode(c, 1.2)
      const env = gainNode(c)
      env.gain.setValueAtTime(0.0001, tt)
      env.gain.linearRampToValueAtTime(0.62, tt + 0.012)
      env.gain.linearRampToValueAtTime(0.32, tt + 0.07)
      env.gain.exponentialRampToValueAtTime(0.0001, tt + d)
      o.connect(fa).connect(ga).connect(env)
      o.connect(fb).connect(gb).connect(env)
      env.connect(out)
      const n = noiseSrc(c)
      const hp = filt(c, 'highpass', 1800)
      const ng = gainNode(c)
      pluck(ng, tt, 0.16, 0.003, 0.05)
      n.connect(hp).connect(ng).connect(out)
      run([o, n], tt, d)
    })
  },

  squeak(c, out, t) {
    const count = 3 + Math.floor(Math.random() * 2)
    for (let i = 0; i < count; i++) {
      const tt = t + i * 0.1
      const f = rand(2600, 3200)
      const o = osc(c, 'sine', f)
      o.frequency.setValueAtTime(f, tt)
      o.frequency.linearRampToValueAtTime(f * 1.35, tt + 0.035)
      o.frequency.linearRampToValueAtTime(f * 1.05, tt + 0.075)
      const vib = osc(c, 'sine', 38)
      const vg = gainNode(c, 90)
      vib.connect(vg).connect(o.frequency)
      const g = gainNode(c)
      pluck(g, tt, 0.26, 0.006, 0.08)
      o.connect(g).connect(out)
      run([o, vib], tt, 0.1)
    }
  },

  nom(c, out, t) {
    for (let i = 0; i < 7; i++) {
      const tt = t + i * 0.105 + rand(-0.01, 0.01)
      const n = noiseSrc(c)
      const bp = filt(c, 'bandpass', rand(1500, 2400), 1.6)
      const g = gainNode(c)
      pluck(g, tt, 0.5, 0.002, 0.035)
      n.connect(bp).connect(g).connect(out)
      const o = osc(c, 'sine', 520)
      o.frequency.exponentialRampToValueAtTime(260, tt + 0.04)
      const og = gainNode(c)
      pluck(og, tt, 0.14, 0.002, 0.04)
      o.connect(og).connect(out)
      run([n, o], tt, 0.06)
    }
  },

  boing(c, out, t) {
    const th = osc(c, 'sine', 150)
    th.frequency.exponentialRampToValueAtTime(48, t + 0.14)
    const tg = gainNode(c)
    pluck(tg, t, 0.7, 0.004, 0.16)
    th.connect(tg).connect(out)
    const o = osc(c, 'triangle', 230)
    o.frequency.setValueAtTime(230, t + 0.04)
    o.frequency.exponentialRampToValueAtTime(700, t + 0.36)
    const lfo = osc(c, 'sine', 17)
    const lg = gainNode(c, 55)
    lfo.connect(lg).connect(o.frequency)
    const g = gainNode(c)
    g.gain.setValueAtTime(0.0001, t + 0.04)
    g.gain.linearRampToValueAtTime(0.22, t + 0.07)
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.42)
    o.connect(g).connect(out)
    run([th, o, lfo], t, 0.45)
  },

  bowl(c, out, t) {
    const base = 196
    const ratios = [1, 2.71, 5.18, 8.4]
    const amps = [0.18, 0.085, 0.04, 0.017]
    const decays = [5.5, 4, 2.6, 1.6]
    ratios.forEach((r, i) => {
      ;[-0.35, 0.35].forEach((det) => {
        const o = osc(c, 'sine', base * r + det * (i + 1))
        const g = gainNode(c)
        g.gain.setValueAtTime(0.0001, t)
        g.gain.linearRampToValueAtTime(amps[i], t + 0.02)
        g.gain.exponentialRampToValueAtTime(0.0001, t + decays[i])
        o.connect(g).connect(out)
        run([o], t, decays[i])
      })
    })
    const n = noiseSrc(c)
    const lp = filt(c, 'lowpass', 420)
    const ng = gainNode(c)
    pluck(ng, t, 0.2, 0.003, 0.08)
    n.connect(lp).connect(ng).connect(out)
    run([n], t, 0.12)
  },

  blup(c, out, t) {
    const o = osc(c, 'sine', 500)
    o.frequency.exponentialRampToValueAtTime(1500, t + 0.07)
    const g = gainNode(c)
    pluck(g, t, 0.28, 0.004, 0.1)
    o.connect(g).connect(out)
    run([o], t, 0.12)
  },

  yawn(c, out, t) {
    const d = 1.3
    const o = osc(c, 'sawtooth', 300)
    o.frequency.setValueAtTime(300, t)
    o.frequency.linearRampToValueAtTime(430, t + 0.35)
    o.frequency.exponentialRampToValueAtTime(190, t + d)
    const lp = filt(c, 'lowpass', 500, 4)
    lp.frequency.setValueAtTime(450, t)
    lp.frequency.linearRampToValueAtTime(1700, t + 0.4)
    lp.frequency.linearRampToValueAtTime(420, t + d)
    const g = gainNode(c)
    g.gain.setValueAtTime(0.0001, t)
    g.gain.linearRampToValueAtTime(0.2, t + 0.25)
    g.gain.linearRampToValueAtTime(0.16, t + d * 0.7)
    g.gain.exponentialRampToValueAtTime(0.0001, t + d)
    o.connect(lp).connect(g).connect(out)
    run([o], t, d)
  },

  snore(c, out, t) {
    ;[0, 1.7].forEach((k) => {
      const tt = t + k
      const n = noiseSrc(c)
      const bp = filt(c, 'bandpass', 260, 2.5)
      const g = gainNode(c)
      g.gain.setValueAtTime(0.0001, tt)
      g.gain.linearRampToValueAtTime(0.5, tt + 0.7)
      g.gain.exponentialRampToValueAtTime(0.0001, tt + 1.1)
      n.connect(bp).connect(g).connect(out)
      const o = osc(c, 'sawtooth', 78)
      const lp = filt(c, 'lowpass', 220)
      const og = gainNode(c)
      og.gain.setValueAtTime(0.0001, tt)
      og.gain.linearRampToValueAtTime(0.08, tt + 0.7)
      og.gain.exponentialRampToValueAtTime(0.0001, tt + 1.1)
      o.connect(lp).connect(og).connect(out)
      run([n, o], tt, 1.15)
    })
  },

  hug(c, out, t) {
    const notes = [174.6, 220, 261.6, 329.6, 392]
    const lp = filt(c, 'lowpass', 1500)
    const g = gainNode(c)
    g.gain.setValueAtTime(0.0001, t)
    g.gain.linearRampToValueAtTime(0.5, t + 0.55)
    g.gain.setValueAtTime(0.5, t + 1.2)
    g.gain.exponentialRampToValueAtTime(0.0001, t + 3)
    lp.connect(g).connect(out)
    notes.forEach((f, i) => {
      ;[-4, 4].forEach((cents) => {
        const o = osc(c, i % 2 ? 'triangle' : 'sine', f * Math.pow(2, cents / 1200))
        const og = gainNode(c, 0.09)
        o.connect(og).connect(lp)
        run([o], t, 3)
      })
    })
    bell(c, out, t + 0.5, 1396.9, 0.08, 2)
    beat(c, out, t + 0.1, 0.8)
  },

  heartbeat(c, out, t) {
    beat(c, out, t, 1)
  },

  tada(c, out, t) {
    const notes = [523.25, 659.25, 783.99, 1046.5]
    notes.forEach((f, i) => {
      const tt = t + i * 0.085
      const o = osc(c, 'triangle', f)
      const g = gainNode(c)
      pluck(g, tt, 0.2, 0.006, i === 3 ? 1.2 : 0.35)
      o.connect(g).connect(out)
      run([o], tt, 1.3)
      bell(c, out, tt, f * 2, 0.06, 0.8)
    })
  },

  whoosh(c, out, t) {
    const n = noiseSrc(c)
    const bp = filt(c, 'bandpass', 400, 1.2)
    bp.frequency.setValueAtTime(350, t)
    bp.frequency.exponentialRampToValueAtTime(2400, t + 0.2)
    bp.frequency.exponentialRampToValueAtTime(700, t + 0.42)
    const g = gainNode(c)
    g.gain.setValueAtTime(0.0001, t)
    g.gain.linearRampToValueAtTime(0.35, t + 0.18)
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.45)
    n.connect(bp).connect(g).connect(out)
    run([n], t, 0.5)
  },

  gift(c, out, t) {
    for (let i = 0; i < 4; i++) {
      const tt = t + i * 0.07
      const n = noiseSrc(c)
      const bp = filt(c, 'bandpass', 900 + i * 200, 2)
      const g = gainNode(c)
      pluck(g, tt, 0.35, 0.002, 0.04)
      n.connect(bp).connect(g).connect(out)
      run([n], tt, 0.06)
    }
    synths.pop(c, out, t + 0.34)
    synths.sparkle(c, out, t + 0.4)
  },

  giggle(c, out, t) {
    const base = rand(820, 960)
    for (let i = 0; i < 5; i++) {
      const tt = t + i * 0.105
      const f = base * (1 - i * 0.045)
      const o = osc(c, 'triangle', f)
      o.frequency.setValueAtTime(f * 0.9, tt)
      o.frequency.linearRampToValueAtTime(f * 1.25, tt + 0.03)
      o.frequency.linearRampToValueAtTime(f * 0.85, tt + 0.075)
      const bp = filt(c, 'bandpass', 1900, 1.5)
      const bg = gainNode(c, 2)
      const g = gainNode(c)
      pluck(g, tt, 0.42, 0.006, 0.075)
      o.connect(bp).connect(bg).connect(g).connect(out)
      run([o], tt, 0.09)
    }
  },
}

function kissAt(c: Ctx, out: AudioNode, t: number, p: number) {
  const o = osc(c, 'sine', 1500 * p)
  o.frequency.exponentialRampToValueAtTime(520 * p, t + 0.035)
  const og = gainNode(c)
  pluck(og, t, 0.4, 0.002, 0.045)
  o.connect(og).connect(out)
  const n = noiseSrc(c)
  const bp = filt(c, 'bandpass', 3000 * p, 1.1)
  bp.frequency.setValueAtTime(3200 * p, t)
  bp.frequency.exponentialRampToValueAtTime(1000 * p, t + 0.17)
  const ng = gainNode(c)
  ng.gain.setValueAtTime(0.0001, t)
  ng.gain.linearRampToValueAtTime(0.32, t + 0.004)
  ng.gain.exponentialRampToValueAtTime(0.06, t + 0.03)
  ng.gain.exponentialRampToValueAtTime(0.0001, t + 0.19)
  n.connect(bp).connect(ng).connect(out)
  run([o, n], t, 0.2)
}

function beat(c: Ctx, out: AudioNode, t: number, k: number) {
  ;[
    [0, 78, 0.9],
    [0.22, 70, 0.6],
  ].forEach(([dt, f, a]) => {
    const tt = t + dt
    const o = osc(c, 'sine', f)
    o.frequency.exponentialRampToValueAtTime(f * 0.55, tt + 0.12)
    const g = gainNode(c)
    pluck(g, tt, a * k, 0.006, 0.16)
    const lp = filt(c, 'lowpass', 180)
    o.connect(lp).connect(g).connect(out)
    run([o], tt, 0.2)
  })
}

// ---------- Муркотіння ----------
/** Один цикл «видих + вдих». Повертає тривалість. */
function purrCycle(c: Ctx, out: AudioNode, t: number, k = 1): number {
  const exh = rand(1.1, 1.4)
  const inh = rand(0.75, 0.95)
  const gap = 0.1
  purrPhase(c, out, t, exh, rand(23, 26), 1 * k)
  purrPhase(c, out, t + exh + gap, inh, rand(26, 29), 0.55 * k)
  return exh + gap + inh + gap
}

function purrPhase(c: Ctx, out: AudioNode, t0: number, dur: number, rate: number, amp: number) {
  const n = noiseSrc(c)
  const lp = filt(c, 'lowpass', 700, 0.8)
  const peak = filt(c, 'peaking', 230, 1)
  peak.gain.value = 9
  const g = gainNode(c)
  const body = osc(c, 'sine', rate * 2.2)
  const bodyG = gainNode(c, 0.35)
  const pulses = Math.floor(dur * rate)
  g.gain.setValueAtTime(0, t0)
  for (let i = 0; i < pulses; i++) {
    const tt = t0 + i / rate
    const x = i / pulses
    const shape = Math.pow(Math.sin(Math.PI * Math.min(1, x * 1.05)), 0.6)
    const a = amp * 0.85 * shape
    g.gain.linearRampToValueAtTime(a * 0.08, tt)
    g.gain.linearRampToValueAtTime(a, tt + 0.28 / rate)
    g.gain.linearRampToValueAtTime(a * 0.12, tt + 0.92 / rate)
  }
  g.gain.linearRampToValueAtTime(0, t0 + dur + 0.02)
  n.connect(lp).connect(peak).connect(g)
  body.connect(bodyG).connect(g)
  g.connect(out)
  run([n, body], t0, dur + 0.05)
}

let purrTimer: number | null = null
let purrEnd = 0
let purrGain: GainNode | null = null

/** Неперервне муркотіння, поки триває погладжування. */
export function startPurr(k = 1) {
  const l = live()
  if (!l) return
  const { c, out } = l
  if (purrTimer !== null) return
  purrGain = gainNode(c, 1)
  purrGain.connect(out)
  purrEnd = c.currentTime + 0.03
  const tick = () => {
    if (!purrGain) return
    while (purrEnd < c.currentTime + 0.8) purrEnd += purrCycle(c, purrGain, purrEnd, k)
  }
  tick()
  purrTimer = window.setInterval(tick, 250)
}

export function stopPurr() {
  if (purrTimer !== null) {
    clearInterval(purrTimer)
    purrTimer = null
  }
  const g = purrGain
  purrGain = null
  if (g && ctx) {
    g.gain.setTargetAtTime(0, ctx.currentTime, 0.18)
    setTimeout(() => g.disconnect(), 1800)
  }
}

/** Коротке муркотіння (≈ один-два цикли). */
export function purrFor(seconds = 2.2, k = 1) {
  const l = live()
  if (!l) return
  let t = l.c.currentTime + 0.02
  const end = t + seconds
  while (t < end) t += purrCycle(l.c, l.out, t, k)
}

// ---------- Серцебиття для довгих обіймів ----------
let hbTimer: number | null = null
export function startHeartbeat() {
  if (hbTimer !== null) return
  const step = () => play('heartbeat')
  step()
  hbTimer = window.setInterval(step, 1000)
}
export function stopHeartbeat() {
  if (hbTimer !== null) clearInterval(hbTimer)
  hbTimer = null
}

export function play(name: SoundName) {
  const l = live()
  if (!l) return
  if (name === 'purr') {
    purrFor(2.4)
    return
  }
  try {
    synths[name](l.c, l.out, l.c.currentTime + 0.015)
  } catch {
    /* звук — не критичний */
  }
}

/** Для тестів: відрендерити звук офлайн. */
export async function renderOffline(name: SoundName, seconds = 3): Promise<AudioBuffer> {
  const off = new OfflineAudioContext(1, 44100 * seconds, 44100)
  if (name === 'purr') {
    let t = 0.02
    while (t < seconds - 2.5) t += purrCycle(off, off.destination, t, 1)
  } else synths[name](off, off.destination, 0.02)
  return off.startRendering()
}

// ---------- Колискова (оригінальна мелодія для цього проєкту) ----------
const N: Record<string, number> = {
  C3: 130.81, D3: 146.83, E3: 164.81, F3: 174.61, G3: 196, A3: 220, Bb3: 233.08,
  C4: 261.63, D4: 293.66, E4: 329.63, F4: 349.23, G4: 392, A4: 440, Bb4: 466.16,
  C5: 523.25, D5: 587.33, E5: 659.25, F5: 698.46, G5: 783.99,
}
// [нота, долі] у розмірі 3/4
const MELODY: [string | null, number][][] = [
  [['A4', 2], ['C5', 1]], [['F5', 2], ['E5', 1]], [['D5', 2], ['C5', 1]], [['A4', 3]],
  [['Bb4', 2], ['D5', 1]], [['F5', 2], ['D5', 1]], [['C5', 1], ['Bb4', 1], ['G4', 1]], [['C5', 3]],
  [['A4', 2], ['C5', 1]], [['E5', 2], ['C5', 1]], [['D5', 1], ['C5', 1], ['Bb4', 1]], [['G4', 2], ['Bb4', 1]],
  [['A4', 1], ['G4', 1], ['F4', 1]], [['G4', 2], ['E4', 1]], [['F4', 3]], [[null, 3]],
]
const CHORDS: string[][] = [
  ['F3', 'A3', 'C4'], ['F3', 'A3', 'C4'], ['D3', 'F3', 'A3'], ['D3', 'F3', 'A3'],
  ['Bb3', 'D4', 'F4'], ['Bb3', 'D4', 'F4'], ['C3', 'E3', 'G3'], ['C3', 'E3', 'G3'],
  ['F3', 'A3', 'C4'], ['A3', 'C4', 'E4'], ['Bb3', 'D4', 'F4'], ['G3', 'Bb3', 'D4'],
  ['C3', 'F3', 'A3'], ['C3', 'E3', 'G3'], ['F3', 'A3', 'C4'], ['F3', 'A3', 'C4'],
]
const BEAT = 60 / 74

let musicTimer: number | null = null
let musicTime = 0
let musicBar = 0
let musicRound = 0

function musicBox(c: Ctx, out: AudioNode, t: number, f: number, peak: number, len: number) {
  ;[
    [1, 1],
    [2, 0.28],
    [3, 0.09],
    [4.02, 0.05],
  ].forEach(([r, a]) => {
    const o = osc(c, 'sine', f * r * (1 + rand(-0.0008, 0.0008)))
    const g = gainNode(c)
    pluck(g, t, peak * a, 0.006, len / r)
    o.connect(g).connect(out)
    run([o], t, len)
  })
}

function scheduleBar(c: Ctx, out: AudioNode, t: number, bar: number, round: number) {
  const up = round % 2 === 1 ? 2 : 1
  let beat = 0
  for (const [note, len] of MELODY[bar]) {
    if (note) musicBox(c, out, t + beat * BEAT, N[note] * up, up > 1 ? 0.12 : 0.17, 1.6 + len * 0.4)
    beat += len
  }
  const ch = CHORDS[bar]
  musicBox(c, out, t, N[ch[0]], 0.11, 1.8)
  musicBox(c, out, t + BEAT, N[ch[1]] * 2, 0.05, 1.1)
  musicBox(c, out, t + 2 * BEAT, N[ch[2]] * 2, 0.05, 1.1)
  // м’який пед
  const lp = filt(c, 'lowpass', 900)
  const pg = gainNode(c)
  pg.gain.setValueAtTime(0.0001, t)
  pg.gain.linearRampToValueAtTime(0.05, t + 0.8)
  pg.gain.linearRampToValueAtTime(0.0001, t + 3 * BEAT + 0.3)
  lp.connect(pg).connect(out)
  ch.forEach((n) => {
    const o = osc(c, 'triangle', N[n])
    o.connect(lp)
    run([o], t, 3 * BEAT + 0.35)
  })
  if (bar % 4 === 3 && Math.random() < 0.6) bell(c, out, t + 2.5 * BEAT, PENTA[Math.floor(rand(0, 5))], 0.03, 1.4)
}

function syncMusic() {
  if (!ctx || !musicBus || !musicGate) return
  const s = getState().settings
  const want = s.sound && s.music
  const t = ctx.currentTime
  if (want && musicTimer === null) {
    musicGate.gain.cancelScheduledValues(t)
    musicGate.gain.setValueAtTime(musicGate.gain.value, t)
    musicGate.gain.linearRampToValueAtTime(1, t + 3)
    musicTime = t + 0.1
    musicBar = 0
    const c = ctx
    const out = musicBus
    const tick = () => {
      while (musicTime < c.currentTime + 1.5) {
        scheduleBar(c, out, musicTime, musicBar, musicRound)
        musicTime += 3 * BEAT
        musicBar++
        if (musicBar >= MELODY.length) {
          musicBar = 0
          musicRound++
        }
      }
    }
    tick()
    musicTimer = window.setInterval(tick, 300)
  } else if (!want && musicTimer !== null) {
    clearInterval(musicTimer)
    musicTimer = null
    musicGate.gain.cancelScheduledValues(t)
    musicGate.gain.setValueAtTime(musicGate.gain.value, t)
    musicGate.gain.linearRampToValueAtTime(0, t + 0.6)
  }
}

/** Приглушити музику, поки грає голосове. */
export function duckMusic(on: boolean) {
  if (!ctx || !duck) return
  duck.gain.setTargetAtTime(on ? 0.08 : 1, ctx.currentTime, 0.2)
}
