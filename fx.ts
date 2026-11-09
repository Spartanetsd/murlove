// Частинки: сердечка, зірочки, лапки — легкі DOM-елементи з Web Animations API.
import { isCalm, rand, choice } from './store'

export type FxKind = 'heart' | 'star' | 'paw' | 'sparkle' | 'petal' | 'moon'

const SHAPES: Record<FxKind, string> = {
  heart:
    '<svg viewBox="0 0 32 30"><path d="M16 29C7 22 1 16.5 1 9.6 1 4.7 4.8 1 9.4 1c2.8 0 5.2 1.4 6.6 3.6C17.4 2.4 19.8 1 22.6 1 27.2 1 31 4.7 31 9.6 31 16.5 25 22 16 29z" fill="currentColor"/><ellipse cx="9" cy="8" rx="4" ry="2.6" fill="#fff" opacity=".45" transform="rotate(-30 9 8)"/></svg>',
  star:
    '<svg viewBox="0 0 32 32"><path d="M16 1.5l4.2 9.3 10.1 1.1-7.6 6.8 2.2 10-8.9-5.2-8.9 5.2 2.2-10-7.6-6.8 10.1-1.1z" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>',
  paw:
    '<svg viewBox="0 0 32 32"><ellipse cx="16" cy="21" rx="8" ry="7" fill="currentColor"/><ellipse cx="7" cy="12" rx="3.4" ry="4.4" fill="currentColor"/><ellipse cx="13" cy="7" rx="3.4" ry="4.4" fill="currentColor"/><ellipse cx="19.5" cy="7" rx="3.4" ry="4.4" fill="currentColor"/><ellipse cx="25.5" cy="12" rx="3.4" ry="4.4" fill="currentColor"/></svg>',
  sparkle: '<svg viewBox="0 0 32 32"><path d="M16 0C17 11 21 15 32 16 21 17 17 21 16 32 15 21 11 17 0 16 11 15 15 11 16 0z" fill="currentColor"/></svg>',
  petal: '<svg viewBox="0 0 32 32"><path d="M16 2C25 9 25 22 16 30 7 22 7 9 16 2z" fill="currentColor"/></svg>',
  moon: '<svg viewBox="0 0 32 32"><path d="M21 3A13 13 0 1 0 29 22 11 11 0 0 1 21 3z" fill="currentColor"/></svg>',
}

const COLORS: Record<FxKind, string[]> = {
  heart: ['#FF6F9C', '#FF8FB1', '#FFA8C5', '#F2557F', '#FFB3A7'],
  star: ['#FFD27A', '#FFC4E1', '#FFE3A3', '#D9C6FF'],
  paw: ['#F7B5A0', '#FFB7CB', '#E7C3FF', '#FFCFA8'],
  sparkle: ['#FFFFFF', '#FFE6F1', '#FFF3C4', '#E9DEFF'],
  petal: ['#FFB7CB', '#FFD1DE', '#FFC7A8', '#E6D3FF'],
  moon: ['#FFE3A3', '#FFF0C9'],
}

let layer: HTMLElement | null = null
let alive = 0
const LIMIT = 140

export function setFxLayer(el: HTMLElement | null) {
  layer = el
}

function spawn(kind: FxKind, x: number, y: number, dim: number): HTMLElement | null {
  if (!layer || alive >= LIMIT) return null
  const el = document.createElement('div')
  el.className = 'fx'
  el.innerHTML = SHAPES[kind]
  el.style.color = choice(COLORS[kind])
  el.style.width = el.style.height = dim + 'px'
  el.style.left = x - dim / 2 + 'px'
  el.style.top = y - dim / 2 + 'px'
  layer.appendChild(el)
  alive++
  return el
}

function finish(el: HTMLElement, anim: Animation) {
  const done = () => {
    el.remove()
    alive--
  }
  anim.onfinish = done
  anim.oncancel = done
}

export interface BurstOpts {
  count?: number
  kinds?: FxKind[]
  spread?: number
  rise?: number
  dim?: [number, number]
  duration?: number
}

/** Вибух частинок з точки (x, y). */
export function burst(x: number, y: number, o: BurstOpts = {}) {
  const calm = isCalm()
  const count = calm ? Math.min(3, o.count ?? 14) : o.count ?? 14
  const kinds = o.kinds ?? ['heart']
  const spread = (o.spread ?? 130) * (calm ? 0.35 : 1)
  const rise = o.rise ?? 60
  const [d0, d1] = o.dim ?? [14, 30]
  for (let i = 0; i < count; i++) {
    const el = spawn(choice(kinds), x, y, rand(d0, d1))
    if (!el) break
    const a = rand(0, Math.PI * 2)
    const r = rand(spread * 0.35, spread)
    const dx = Math.cos(a) * r
    const dy = Math.sin(a) * r * 0.8 - rise
    const rot = rand(-50, 50)
    const dur = (o.duration ?? 1100) * rand(0.75, 1.25) * (calm ? 0.7 : 1)
    const anim = el.animate(
      [
        { transform: 'translate(0,0) scale(.2) rotate(0deg)', opacity: 0 },
        { transform: `translate(${dx * 0.55}px,${dy * 0.55}px) scale(1.1) rotate(${rot * 0.6}deg)`, opacity: 1, offset: 0.35 },
        { transform: `translate(${dx}px,${dy - 30}px) scale(.85) rotate(${rot}deg)`, opacity: 0 },
      ],
      { duration: dur, easing: 'cubic-bezier(.2,.8,.3,1)', delay: calm ? 0 : rand(0, 80) },
    )
    finish(el, anim)
  }
}

/** Плавно спливають угору (для погладжування). */
export function floatUp(x: number, y: number, kind: FxKind = 'heart', n = 1) {
  const calm = isCalm()
  for (let i = 0; i < n; i++) {
    const el = spawn(kind, x + rand(-14, 14), y, rand(14, 24))
    if (!el) return
    const dx = rand(-30, 30)
    const anim = el.animate(
      [
        { transform: 'translate(0,0) scale(.4)', opacity: 0 },
        { transform: `translate(${dx * 0.4}px,-30px) scale(1)`, opacity: 1, offset: 0.25 },
        { transform: `translate(${dx}px,-${calm ? 50 : 120}px) scale(.8)`, opacity: 0 },
      ],
      { duration: calm ? 700 : 1400, easing: 'ease-out' },
    )
    finish(el, anim)
  }
}

/** Дощ із сердечок на весь екран. */
export function rain(kinds: FxKind[] = ['heart'], count = 36) {
  const calm = isCalm()
  const n = calm ? Math.min(8, count) : count
  const W = window.innerWidth
  const H = window.innerHeight
  for (let i = 0; i < n; i++) {
    const x = rand(10, W - 10)
    const el = spawn(choice(kinds), x, -30, rand(16, 34))
    if (!el) break
    const sway = rand(-60, 60)
    const anim = el.animate(
      [
        { transform: 'translate(0,0) rotate(0deg)', opacity: 0 },
        { transform: `translate(${sway * 0.5}px,${H * 0.3}px) rotate(${rand(-40, 40)}deg)`, opacity: 1, offset: 0.15 },
        { transform: `translate(${sway}px,${H + 60}px) rotate(${rand(-90, 90)}deg)`, opacity: 0.9 },
      ],
      { duration: rand(2200, 3800) * (calm ? 0.8 : 1), delay: rand(0, calm ? 300 : 1400), easing: 'cubic-bezier(.3,.1,.6,1)', fill: 'backwards' },
    )
    finish(el, anim)
  }
}

/** Центр елемента у координатах вікна. */
export function centerOf(el: Element | null): [number, number] {
  if (!el) return [window.innerWidth / 2, window.innerHeight / 2]
  const r = el.getBoundingClientRect()
  return [r.left + r.width / 2, r.top + r.height / 2]
}
