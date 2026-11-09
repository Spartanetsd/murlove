// Спільна графіка: градієнти, сердечка, лапки, подарунок, квіти, іконки.
// Уся графіка намальована спеціально для цього застосунку (власний вектор).
import type { CSSProperties, ReactNode } from 'react'

/** «Пухнастий» контур: еліпс із м’якими горбиками по краю. */
export function fluff(cx: number, cy: number, rx: number, ry: number, bumps = 18, depth = 3.5, phase = 0): string {
  const P = Math.PI * 2
  const pt = (a: number, ex = 0) => [cx + Math.cos(a) * (rx + ex), cy + Math.sin(a) * (ry + ex)]
  const f = (n: number) => n.toFixed(1)
  const a0 = phase
  const [sx, sy] = pt(a0)
  let d = `M${f(sx)} ${f(sy)}`
  for (let i = 0; i < bumps; i++) {
    const a1 = phase + ((i + 1) / bumps) * P
    const am = phase + ((i + 0.5) / bumps) * P
    const [qx, qy] = pt(am, depth * 2)
    const [x1, y1] = pt(a1)
    d += ` Q${f(qx)} ${f(qy)} ${f(x1)} ${f(y1)}`
  }
  return d + 'Z'
}

export const HEART_D =
  'M50 90C21 69 4 51 4 31 4 16 15 5 29 5c9 0 16.5 5 21 12.5C54.5 10 62 5 71 5c14 0 25 11 25 26 0 20-17 38-46 59z'

/** Глобальні градієнти — один раз на документ. */
export function SvgDefs() {
  return (
    <svg width="0" height="0" aria-hidden="true" style={{ position: 'absolute', width: 0, height: 0, overflow: 'hidden' }}>
      <defs>
        <radialGradient id="mg-kitty" cx=".38" cy=".3" r=".8">
          <stop offset="0" stopColor="#FFF7EC" />
          <stop offset=".55" stopColor="#FFDDBD" />
          <stop offset="1" stopColor="#EFAA7E" />
        </radialGradient>
        <radialGradient id="mg-belly" cx=".5" cy=".4" r=".65">
          <stop offset="0" stopColor="#FFFFFF" />
          <stop offset="1" stopColor="#FFEBDA" />
        </radialGradient>
        <radialGradient id="mg-puppy" cx=".38" cy=".3" r=".8">
          <stop offset="0" stopColor="#FFF4DE" />
          <stop offset=".55" stopColor="#F9D39B" />
          <stop offset="1" stopColor="#DE9E5E" />
        </radialGradient>
        <linearGradient id="mg-puppy-ear" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#E2A267" />
          <stop offset="1" stopColor="#B9733F" />
        </linearGradient>
        <radialGradient id="mg-cream" cx=".45" cy=".35" r=".7">
          <stop offset="0" stopColor="#FFFFFF" />
          <stop offset="1" stopColor="#FFEED9" />
        </radialGradient>
        <radialGradient id="mg-bunny" cx=".38" cy=".3" r=".8">
          <stop offset="0" stopColor="#FFFFFF" />
          <stop offset=".6" stopColor="#F5EFFF" />
          <stop offset="1" stopColor="#D8CBF3" />
        </radialGradient>
        <radialGradient id="mg-capy" cx=".36" cy=".28" r=".85">
          <stop offset="0" stopColor="#EED3B1" />
          <stop offset=".55" stopColor="#D1A67C" />
          <stop offset="1" stopColor="#A77A53" />
        </radialGradient>
        <radialGradient id="mg-capy-snout" cx=".45" cy=".25" r=".85">
          <stop offset="0" stopColor="#C29A75" />
          <stop offset="1" stopColor="#8A6447" />
        </radialGradient>
        <radialGradient id="mg-hamster" cx=".42" cy=".22" r=".85">
          <stop offset="0" stopColor="#FFE9C9" />
          <stop offset=".5" stopColor="#FFC68A" />
          <stop offset="1" stopColor="#EE9C55" />
        </radialGradient>
        <radialGradient id="mg-panda-w" cx=".38" cy=".3" r=".8">
          <stop offset="0" stopColor="#FFFFFF" />
          <stop offset=".6" stopColor="#F4F1F8" />
          <stop offset="1" stopColor="#D9D2E6" />
        </radialGradient>
        <radialGradient id="mg-panda-d" cx=".4" cy=".3" r=".8">
          <stop offset="0" stopColor="#74698A" />
          <stop offset="1" stopColor="#433A54" />
        </radialGradient>
        <linearGradient id="mg-pink-in" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#FFCADA" />
          <stop offset="1" stopColor="#FF9DB9" />
        </linearGradient>
        <radialGradient id="mg-eye" cx=".45" cy=".38" r=".62">
          <stop offset="0" stopColor="#6E4E62" />
          <stop offset="1" stopColor="#25171F" />
        </radialGradient>
        <radialGradient id="mg-eye-green" cx=".5" cy=".58" r=".58">
          <stop offset="0" stopColor="#E3F5AE" />
          <stop offset=".55" stopColor="#8DC46B" />
          <stop offset="1" stopColor="#3B6638" />
        </radialGradient>
        <radialGradient id="mg-eye-amber" cx=".5" cy=".6" r=".6">
          <stop offset="0" stopColor="#F5C987" />
          <stop offset=".55" stopColor="#B87443" />
          <stop offset="1" stopColor="#5A3020" />
        </radialGradient>
        <radialGradient id="mg-cheek">
          <stop offset="0" stopColor="#FF7FA3" stopOpacity=".72" />
          <stop offset="1" stopColor="#FF9AB8" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="mg-shadow">
          <stop offset="0" stopColor="#9A5070" stopOpacity=".3" />
          <stop offset="1" stopColor="#9A5070" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="mg-heart" cx=".33" cy=".28" r=".85">
          <stop offset="0" stopColor="#FFC0D3" />
          <stop offset=".5" stopColor="#FF7AA3" />
          <stop offset="1" stopColor="#E2466F" />
        </radialGradient>
        <radialGradient id="mg-heart-soft" cx=".35" cy=".3" r=".85">
          <stop offset="0" stopColor="#FFE0EA" />
          <stop offset="1" stopColor="#FF9EBB" />
        </radialGradient>
        <radialGradient id="mg-orange" cx=".35" cy=".3" r=".8">
          <stop offset="0" stopColor="#FFD892" />
          <stop offset=".6" stopColor="#FFA53D" />
          <stop offset="1" stopColor="#EE821C" />
        </radialGradient>
        <linearGradient id="mg-leaf" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#A9DE8F" />
          <stop offset="1" stopColor="#5DAA5A" />
        </linearGradient>
        <radialGradient id="mg-gold" cx=".4" cy=".35" r=".7">
          <stop offset="0" stopColor="#FFF2BF" />
          <stop offset=".6" stopColor="#F6C85A" />
          <stop offset="1" stopColor="#D49A35" />
        </radialGradient>
        <radialGradient id="mg-nose" cx=".4" cy=".3" r=".8">
          <stop offset="0" stopColor="#FFB9CB" />
          <stop offset="1" stopColor="#F2789A" />
        </radialGradient>
        <radialGradient id="mg-nose-dark" cx=".4" cy=".3" r=".8">
          <stop offset="0" stopColor="#7A6070" />
          <stop offset="1" stopColor="#36252F" />
        </radialGradient>
        <linearGradient id="mg-gift" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#FFCADB" />
          <stop offset="1" stopColor="#FF8DB0" />
        </linearGradient>
        <linearGradient id="mg-gift-lid" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#FFE0EA" />
          <stop offset="1" stopColor="#FFA8C4" />
        </linearGradient>
        <linearGradient id="mg-ribbon" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#D9C8FF" />
          <stop offset="1" stopColor="#9C80EE" />
        </linearGradient>
        <radialGradient id="mg-cushion" cx=".45" cy=".3" r=".8">
          <stop offset="0" stopColor="#FFE4EC" />
          <stop offset="1" stopColor="#F7A6C2" />
        </radialGradient>
        <radialGradient id="mg-paw" cx=".4" cy=".3" r=".8">
          <stop offset="0" stopColor="#FFF8EF" />
          <stop offset="1" stopColor="#FFD5B5" />
        </radialGradient>
        <radialGradient id="mg-water" cx=".5" cy=".3" r=".8">
          <stop offset="0" stopColor="#D8F1FF" />
          <stop offset="1" stopColor="#9CCFF0" />
        </radialGradient>
        <linearGradient id="mg-lips" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#FF7FA6" />
          <stop offset="1" stopColor="#E2416E" />
        </linearGradient>
      </defs>
    </svg>
  )
}

// ---------- Сердечко ----------
export function HeartSvg({ className, style, fill = 'url(#mg-heart)', gloss = true }: { className?: string; style?: CSSProperties; fill?: string; gloss?: boolean }) {
  return (
    <svg viewBox="0 0 100 95" className={className} style={style} aria-hidden="true">
      <path d={HEART_D} fill={fill} />
      {gloss && (
        <>
          <ellipse cx="28" cy="25" rx="13" ry="8" fill="#fff" opacity=".5" transform="rotate(-35 28 25)" />
          <circle cx="42" cy="17" r="3" fill="#fff" opacity=".6" />
        </>
      )}
    </svg>
  )
}

// ---------- Лапка для обіймів ----------
export function HugPaw({ side, className }: { side: 'l' | 'r'; className?: string }) {
  const flip = side === 'r' ? 'scale(-1 1) translate(-200 0)' : undefined
  return (
    <svg viewBox="0 0 200 120" className={className} aria-hidden="true">
      <g transform={flip}>
        <path d="M-40 60 C20 40 70 34 118 40 L118 86 C70 92 20 86 -40 80Z" fill="url(#mg-kitty)" />
        <path d={fluff(140, 62, 40, 34, 14, 3)} fill="url(#mg-paw)" />
        <ellipse cx="146" cy="72" rx="15" ry="12" fill="url(#mg-pink-in)" />
        <ellipse cx="166" cy="48" rx="6.5" ry="8" fill="url(#mg-pink-in)" />
        <ellipse cx="170" cy="66" rx="6" ry="7.5" fill="url(#mg-pink-in)" />
        <ellipse cx="152" cy="38" rx="6" ry="7.5" fill="url(#mg-pink-in)" />
      </g>
    </svg>
  )
}

// ---------- Губки для поцілунку ----------
export function LipsSvg({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 120" className={className} aria-hidden="true">
      <path d="M8 58C30 30 60 14 82 26c8 4 13 8 18 8s10-4 18-8c22-12 52 4 74 32-22 6-45 6-92 0-47 6-70 6-92 0z" fill="url(#mg-lips)" />
      <path d="M8 58c47 6 70 6 92 0 22 6 45 6 92 0-22 34-55 54-92 54S30 92 8 58z" fill="url(#mg-lips)" />
      <path d="M8 58c47 6 70 6 92 0 22 6 45 6 92 0" fill="none" stroke="#B9325A" strokeWidth="3" strokeLinecap="round" opacity=".6" />
      <ellipse cx="62" cy="82" rx="22" ry="7" fill="#fff" opacity=".35" transform="rotate(-8 62 82)" />
      <ellipse cx="66" cy="36" rx="12" ry="4" fill="#fff" opacity=".35" transform="rotate(-15 66 36)" />
    </svg>
  )
}

// ---------- Подарункова коробочка ----------
export function GiftSvg({ open, className }: { open?: boolean; className?: string }) {
  return (
    <svg viewBox="0 0 240 240" className={className} aria-hidden="true">
      <ellipse cx="120" cy="222" rx="80" ry="10" fill="url(#mg-shadow)" />
      <g className="gift-box">
        <rect x="42" y="104" width="156" height="112" rx="18" fill="url(#mg-gift)" />
        <rect x="42" y="104" width="156" height="22" rx="10" fill="#000" opacity=".06" />
        <rect x="108" y="104" width="24" height="112" fill="url(#mg-ribbon)" />
        <circle cx="72" cy="150" r="5" fill="#fff" opacity=".55" />
        <circle cx="168" cy="178" r="4" fill="#fff" opacity=".5" />
        <circle cx="86" cy="190" r="3.5" fill="#fff" opacity=".5" />
        <path d="M160 138l3 6 6 1-4.5 4 1 6-5.5-3-5.5 3 1-6-4.5-4 6-1z" fill="#fff" opacity=".6" />
      </g>
      <g className={'gift-lid' + (open ? ' is-open' : '')}>
        <rect x="32" y="78" width="176" height="36" rx="14" fill="url(#mg-gift-lid)" />
        <rect x="106" y="78" width="28" height="36" fill="url(#mg-ribbon)" />
        <path d="M120 80C96 40 62 46 70 66c5 12 30 14 50 14z" fill="url(#mg-ribbon)" />
        <path d="M120 80c24-40 58-34 50-14-5 12-30 14-50 14z" fill="url(#mg-ribbon)" />
        <path d="M86 62c8-6 20 4 28 14" fill="none" stroke="#fff" strokeWidth="3" opacity=".45" strokeLinecap="round" />
        <circle cx="120" cy="78" r="10" fill="#B49BF5" />
      </g>
    </svg>
  )
}

// ---------- Квіти ----------
export interface FlowerDef {
  name: string
  kind: 'round' | 'tulip' | 'rose' | 'sun' | 'lavender' | 'daisy'
  petal: string
  petal2: string
  center: string
  text: string
}

export function FlowerSvg({ f, className }: { f: FlowerDef; className?: string }) {
  const stem = (
    <g>
      <path d="M120 128C118 160 122 190 120 226" stroke="#6DB46A" strokeWidth="7" fill="none" strokeLinecap="round" />
      <path d="M120 186c-22-18-44-14-50-4 16 10 34 12 50 4z" fill="url(#mg-leaf)" />
      <path d="M121 166c20-18 42-16 48-6-14 10-32 12-48 6z" fill="url(#mg-leaf)" />
    </g>
  )
  let head: ReactNode
  if (f.kind === 'tulip') {
    head = (
      <g className="bloom">
        <path d="M120 60c-30 6-42 34-34 62 6 14 22 18 34 18s28-4 34-18c8-28-4-56-34-62z" fill={f.petal} />
        <path d="M120 64c-14 16-16 46-2 74 4 0 8 0 12-1-14-26-12-54-10-73z" fill={f.petal2} opacity=".85" />
        <path d="M120 140c-20 0-34-12-38-30 12 6 24 10 38 10s26-4 38-10c-4 18-18 30-38 30z" fill={f.petal2} />
        <path d="M86 92c6-20 18-28 30-30-8 8-14 18-16 32z" fill="#fff" opacity=".35" />
      </g>
    )
  } else if (f.kind === 'lavender') {
    head = (
      <g className="bloom">
        {Array.from({ length: 9 }, (_, i) => (
          <g key={i}>
            <ellipse cx={112 - (i % 2) * -16} cy={58 + i * 9} rx="9" ry="6.5" fill={i % 2 ? f.petal : f.petal2} />
          </g>
        ))}
      </g>
    )
  } else if (f.kind === 'rose') {
    head = (
      <g className="bloom">
        <circle cx="120" cy="98" r="44" fill={f.petal2} />
        {[0, 72, 144, 216, 288].map((a) => (
          <ellipse key={a} cx="120" cy="66" rx="26" ry="30" fill={f.petal} transform={`rotate(${a} 120 98)`} opacity=".9" />
        ))}
        <circle cx="120" cy="98" r="24" fill={f.petal2} />
        <path d="M108 96c2-12 22-14 26-2 2 8-6 14-12 12-6-2-6-8-2-10" fill="none" stroke={f.center} strokeWidth="4" strokeLinecap="round" />
        <path d="M100 104c0 14 12 22 24 20" fill="none" stroke={f.center} strokeWidth="3.5" strokeLinecap="round" opacity=".7" />
      </g>
    )
  } else {
    const n = f.kind === 'sun' ? 18 : f.kind === 'daisy' ? 16 : 8
    const rx = f.kind === 'sun' ? 9 : f.kind === 'daisy' ? 8 : 20
    const ry = f.kind === 'sun' ? 30 : f.kind === 'daisy' ? 30 : 28
    const cr = f.kind === 'sun' ? 26 : f.kind === 'daisy' ? 16 : 18
    head = (
      <g className="bloom">
        {Array.from({ length: n }, (_, i) => (
          <ellipse
            key={i}
            cx="120"
            cy={98 - ry}
            rx={rx}
            ry={ry}
            fill={i % 2 ? f.petal : f.petal2}
            transform={`rotate(${(360 / n) * i} 120 98)`}
          />
        ))}
        <circle cx="120" cy="98" r={cr} fill={f.center} />
        <circle cx={120 - cr * 0.3} cy={98 - cr * 0.3} r={cr * 0.35} fill="#fff" opacity=".35" />
      </g>
    )
  }
  return (
    <svg viewBox="0 0 240 240" className={className} aria-hidden="true">
      <ellipse cx="120" cy="228" rx="50" ry="7" fill="url(#mg-shadow)" />
      {stem}
      {head}
    </svg>
  )
}

// ---------- Хмаринка ----------
export function CloudSvg({ className, style }: { className?: string; style?: CSSProperties }) {
  return (
    <svg viewBox="0 0 200 100" className={className} style={style} aria-hidden="true">
      <path
        d="M38 88c-20 0-32-12-32-28s14-28 30-26c4-18 20-30 40-28 12-14 38-14 50 4 20-6 42 8 42 30 16 2 26 14 26 26 0 14-12 22-28 22z"
        fill="#fff"
        opacity=".85"
      />
    </svg>
  )
}

// ---------- Апельсин (для капібари) ----------
export function Orange({ x, y, r = 16 }: { x: number; y: number; r?: number }) {
  return (
    <g>
      <circle cx={x} cy={y} r={r} fill="url(#mg-orange)" />
      <circle cx={x - r * 0.35} cy={y - r * 0.35} r={r * 0.25} fill="#fff" opacity=".45" />
      <path d={`M${x} ${y - r + 1}c4-8 12-10 18-8-4 6-10 9-18 8z`} fill="url(#mg-leaf)" />
    </g>
  )
}

// ---------- Іконки ----------
type IconName =
  | 'home'
  | 'paw'
  | 'laugh'
  | 'hug'
  | 'gift'
  | 'love'
  | 'gear'
  | 'sound'
  | 'mute'
  | 'close'
  | 'plus'
  | 'trash'
  | 'mic'
  | 'stop'
  | 'play'
  | 'pause'
  | 'share'
  | 'upload'
  | 'left'
  | 'right'
  | 'music'
  | 'sparkle'

export function Icon({ name, className }: { name: IconName; className?: string }) {
  const p = { fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }
  let body: ReactNode = null
  switch (name) {
    case 'home':
      body = (
        <>
          <path {...p} d="M3.5 11 12 4l8.5 7v8.5a1.5 1.5 0 0 1-1.5 1.5H5a1.5 1.5 0 0 1-1.5-1.5z" />
          <path d="M12 18.2c-2.6-1.8-4-3.2-4-4.9a2 2 0 0 1 4-.6 2 2 0 0 1 4 .6c0 1.7-1.4 3.1-4 4.9z" fill="currentColor" />
        </>
      )
      break
    case 'paw':
      body = (
        <g fill="currentColor">
          <ellipse cx="12" cy="16" rx="5" ry="4.3" />
          <ellipse cx="5.5" cy="10" rx="2.1" ry="2.8" />
          <ellipse cx="9.5" cy="6" rx="2.1" ry="2.8" />
          <ellipse cx="14.5" cy="6" rx="2.1" ry="2.8" />
          <ellipse cx="18.5" cy="10" rx="2.1" ry="2.8" />
        </g>
      )
      break
    case 'laugh':
      body = (
        <>
          <circle {...p} cx="12" cy="12" r="9" />
          <path {...p} d="M8 9.5c.6-.8 1.6-.8 2.2 0M13.8 9.5c.6-.8 1.6-.8 2.2 0" />
          <path d="M7.5 13h9c0 2.8-2 4.6-4.5 4.6S7.5 15.8 7.5 13z" fill="currentColor" />
        </>
      )
      break
    case 'hug':
      body = (
        <>
          <path d="M12 19.5C6.5 15.6 4 12.8 4 9.6 4 7.1 6 5 8.4 5c1.5 0 2.8.8 3.6 2 .8-1.2 2.1-2 3.6-2C18 5 20 7.1 20 9.6c0 3.2-2.5 6-8 9.9z" fill="currentColor" />
          <path {...p} d="M2 13c2 2.5 4 3.6 6 3.8M22 13c-2 2.5-4 3.6-6 3.8" />
        </>
      )
      break
    case 'gift':
      body = (
        <>
          <rect {...p} x="4" y="10" width="16" height="10" rx="2" />
          <rect {...p} x="3" y="7" width="18" height="4" rx="1.5" />
          <path {...p} d="M12 7v13M12 7C10 3.5 6.5 4 7 6c.3 1 2.6 1 5 1zM12 7c2-3.5 5.5-3 5-1-.3 1-2.6 1-5 1z" />
        </>
      )
      break
    case 'love':
      body = (
        <>
          <path d="M9 18C4.6 14.9 2.5 12.6 2.5 10A3.5 3.5 0 0 1 9 8.1 3.5 3.5 0 0 1 15.5 10c0 2.6-2.1 4.9-6.5 8z" fill="currentColor" opacity=".55" />
          <path d="M15 20.5c-4.4-3.1-6.5-5.4-6.5-8a3.5 3.5 0 0 1 6.5-1.9 3.5 3.5 0 0 1 6.5 1.9c0 2.6-2.1 4.9-6.5 8z" fill="currentColor" />
        </>
      )
      break
    case 'gear':
      body = (
        <>
          <circle {...p} cx="12" cy="12" r="3.2" />
          <path
            {...p}
            d="M12 2.8v2.4M12 18.8v2.4M21.2 12h-2.4M5.2 12H2.8M18.5 5.5l-1.7 1.7M7.2 16.8l-1.7 1.7M18.5 18.5l-1.7-1.7M7.2 7.2 5.5 5.5"
          />
          <circle {...p} cx="12" cy="12" r="6.6" />
        </>
      )
      break
    case 'sound':
      body = (
        <>
          <path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z" fill="currentColor" />
          <path {...p} d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11" />
        </>
      )
      break
    case 'mute':
      body = (
        <>
          <path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z" fill="currentColor" />
          <path {...p} d="M16 9.5l5 5M21 9.5l-5 5" />
        </>
      )
      break
    case 'music':
      body = (
        <>
          <path {...p} d="M9 17.5V6l10-2v11.5" />
          <circle cx="6.8" cy="17.5" r="2.3" fill="currentColor" />
          <circle cx="16.8" cy="15.5" r="2.3" fill="currentColor" />
        </>
      )
      break
    case 'close':
      body = <path {...p} d="M6 6l12 12M18 6 6 18" />
      break
    case 'plus':
      body = <path {...p} d="M12 5v14M5 12h14" />
      break
    case 'trash':
      body = <path {...p} d="M4.5 7h15M10 7V4.5h4V7M6.5 7l1 12.5h9l1-12.5M10 11v5M14 11v5" />
      break
    case 'mic':
      body = (
        <>
          <rect x="9" y="3" width="6" height="11" rx="3" fill="currentColor" />
          <path {...p} d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21M8.5 21h7" />
        </>
      )
      break
    case 'stop':
      body = <rect x="6" y="6" width="12" height="12" rx="3" fill="currentColor" />
      break
    case 'play':
      body = <path d="M8 5.5v13a1 1 0 0 0 1.5.9l10-6.5a1 1 0 0 0 0-1.8l-10-6.5A1 1 0 0 0 8 5.5z" fill="currentColor" />
      break
    case 'pause':
      body = (
        <g fill="currentColor">
          <rect x="6.5" y="5" width="4" height="14" rx="1.5" />
          <rect x="13.5" y="5" width="4" height="14" rx="1.5" />
        </g>
      )
      break
    case 'share':
      body = <path {...p} d="M12 3.5v11M8 7.5l4-4 4 4M6 11.5H5v8.5h14v-8.5h-1" />
      break
    case 'upload':
      body = <path {...p} d="M12 15V4M8 8l4-4 4 4M4.5 15v3.5a1.5 1.5 0 0 0 1.5 1.5h12a1.5 1.5 0 0 0 1.5-1.5V15" />
      break
    case 'left':
      body = <path {...p} d="M15 5l-7 7 7 7" />
      break
    case 'right':
      body = <path {...p} d="M9 5l7 7-7 7" />
      break
    case 'sparkle':
      body = <path d="M12 2c.8 5.4 2.6 7.2 8 8-5.4.8-7.2 2.6-8 8-.8-5.4-2.6-7.2-8-8 5.4-.8 7.2-2.6 8-8z" fill="currentColor" />
      break
  }
  return (
    <svg viewBox="0 0 24 24" className={'icon ' + (className || '')} aria-hidden="true">
      {body}
    </svg>
  )
}
