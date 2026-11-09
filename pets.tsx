// Шестеро пухнастиків. Об’ємні векторні персонажі з окремими частинами для анімацій:
// кліпання очей, вушка, хвостики, дихання, перекид животиком догори.
import type { CSSProperties, ReactNode } from 'react'
import { fluff, HEART_D, Orange } from './art'

export type PetId = 'kitty' | 'puppy' | 'bunny' | 'capy' | 'hamster' | 'panda'
export const PET_IDS: PetId[] = ['kitty', 'puppy', 'bunny', 'capy', 'hamster', 'panda']

export type PetState =
  | 'idle'
  | 'happy'
  | 'pet'
  | 'eat'
  | 'sleep'
  | 'belly'
  | 'talk'
  | 'hop'
  | 'heart'
  | 'stretch'
  | 'shy'

export interface PetProps {
  state?: PetState
  cheeks?: number
  mini?: boolean
  className?: string
  style?: CSSProperties
}

const INK = '#4A2E3E'

// ---------- Спільні деталі ----------
type EyeMode = 'open' | 'happy' | 'sleep'

function eyeMode(state: PetState): EyeMode {
  if (state === 'sleep') return 'sleep'
  if (state === 'happy' || state === 'pet' || state === 'belly' || state === 'heart' || state === 'shy') return 'happy'
  return 'open'
}

function Eye({ cx, cy, r, iris, mode, ink = INK }: { cx: number; cy: number; r: number; iris?: string; mode: EyeMode; ink?: string }) {
  if (mode === 'happy')
    return (
      <path
        d={`M${cx - r} ${cy + r * 0.35}Q${cx} ${cy - r * 0.95} ${cx + r} ${cy + r * 0.35}`}
        fill="none"
        stroke={ink}
        strokeWidth={r * 0.36}
        strokeLinecap="round"
      />
    )
  if (mode === 'sleep')
    return (
      <path
        d={`M${cx - r} ${cy}Q${cx} ${cy + r * 0.85} ${cx + r} ${cy}`}
        fill="none"
        stroke={ink}
        strokeWidth={r * 0.32}
        strokeLinecap="round"
      />
    )
  return (
    <g className="eye">
      <ellipse cx={cx} cy={cy} rx={r} ry={r * 1.1} fill={iris || 'url(#mg-eye)'} />
      {iris && <ellipse cx={cx} cy={cy + r * 0.08} rx={r * 0.5} ry={r * 0.74} fill="#23151E" />}
      <ellipse cx={cx - r * 0.3} cy={cy - r * 0.4} rx={r * 0.36} ry={r * 0.32} fill="#fff" />
      <circle cx={cx + r * 0.36} cy={cy + r * 0.34} r={r * 0.15} fill="#fff" opacity=".85" />
    </g>
  )
}

function Eyes({ l, r, rad, iris, state, ink }: { l: [number, number]; r: [number, number]; rad: number; iris?: string; state: PetState; ink?: string }) {
  const m = eyeMode(state)
  return (
    <g className="eyes">
      <Eye cx={l[0]} cy={l[1]} r={rad} iris={iris} mode={m} ink={ink} />
      <Eye cx={r[0]} cy={r[1]} r={rad} iris={iris} mode={m} ink={ink} />
    </g>
  )
}

function Cheeks({ l, r, rx = 15, ry = 9 }: { l: [number, number]; r: [number, number]; rx?: number; ry?: number }) {
  return (
    <g className="cheeks">
      <ellipse cx={l[0]} cy={l[1]} rx={rx} ry={ry} fill="url(#mg-cheek)" />
      <ellipse cx={r[0]} cy={r[1]} rx={rx} ry={ry} fill="url(#mg-cheek)" />
    </g>
  )
}

function Whiskers({ y, x0, len = 28, color = '#D2A497' }: { y: number; x0: number; len?: number; color?: string }) {
  const p = { stroke: color, strokeWidth: 1.6, strokeLinecap: 'round' as const, opacity: 0.85 }
  const x1 = 240 - x0
  return (
    <g className="whiskers">
      <path {...p} d={`M${x0} ${y}L${x0 - len} ${y - 4}`} />
      <path {...p} d={`M${x0} ${y + 6}L${x0 - len} ${y + 9}`} />
      <path {...p} d={`M${x1} ${y}L${x1 + len} ${y - 4}`} />
      <path {...p} d={`M${x1} ${y + 6}L${x1 + len} ${y + 9}`} />
    </g>
  )
}

function Mouth({ x, y, w = 7, state, tongue }: { x: number; y: number; w?: number; state: PetState; tongue?: boolean }) {
  if (state === 'talk' || state === 'eat') {
    return (
      <g className={state === 'eat' ? 'munch' : ''}>
        <ellipse cx={x} cy={y + 6} rx={w * 0.8} ry={w * 0.75} fill="#B84A66" />
        <ellipse cx={x} cy={y + 9} rx={w * 0.5} ry={w * 0.35} fill="#FF97B0" />
      </g>
    )
  }
  return (
    <g>
      <path
        d={`M${x} ${y - 2}v3M${x} ${y + 1}q0 ${w * 0.8} ${-w} ${w * 0.9}M${x} ${y + 1}q0 ${w * 0.8} ${w} ${w * 0.9}`}
        fill="none"
        stroke="#8C5A6C"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
      {tongue && <path d={`M${x - 5} ${y + w * 0.9}q5 ${w * 1.7} 10 0z`} fill="#FF8FAB" stroke="#E0607F" strokeWidth="1" />}
    </g>
  )
}

/** Місяці й зірочки над сонним пухнастиком. */
function Sleepy({ x, y }: { x: number; y: number }) {
  return (
    <g className="sleepy">
      <path d={`M${x + 10} ${y - 4}a14 14 0 1 0 11 20 11 11 0 0 1-11-20z`} fill="#FFD98A" className="s1" />
      <path d={`M${x + 30} ${y - 30}l2.6 6.4 6.4 1.2-5 4 1.3 6.4-5.3-3.6-5.3 3.6 1.3-6.4-5-4 6.4-1.2z`} fill="#FFE9B0" className="s2" />
      <circle cx={x - 8} cy={y - 18} r="4" fill="#E2D3FF" className="s3" />
    </g>
  )
}

function Shadow({ rx = 72 }: { rx?: number }) {
  return <ellipse cx="120" cy="223" rx={rx} ry="10" fill="url(#mg-shadow)" className="shadow" />
}

function Frame({ id, state, mini, className, style, children }: { id: PetId; state: PetState; mini?: boolean; className?: string; style?: CSSProperties; children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 240 240"
      className={`pet pet-${id} st-${state}${mini ? ' mini' : ''}${className ? ' ' + className : ''}`}
      style={style}
      aria-hidden="true"
    >
      {children}
    </svg>
  )
}

function mirror(children: ReactNode) {
  return <g transform="matrix(-1 0 0 1 240 0)">{children}</g>
}

// ---------- Киця Мурка ----------
const KITTY_HEAD = fluff(120, 106, 66, 56, 28, 2.6)
const KITTY_BODY = fluff(120, 172, 52, 46, 22, 2.6)
const KITTY_PAW_L = fluff(98, 212, 16, 10, 10, 1.4)
const KITTY_PAW_R = fluff(142, 212, 16, 10, 10, 1.4, 0.3)

function KittyEar() {
  return (
    <>
      <path d="M64 86C60 60 64 38 72 26c4-6 10-5 14 1l30 36z" fill="url(#mg-kitty)" />
      <path d="M74 74c-2-16 1-28 6-36 3-3 6-2 8 1l16 22z" fill="url(#mg-pink-in)" />
      <path d="M79 52c3 4 5 8 6 12" stroke="#fff" strokeWidth="2" opacity=".6" strokeLinecap="round" />
    </>
  )
}

export function Kitty({ state = 'idle', mini, className, style }: PetProps) {
  return (
    <Frame id="kitty" state={state} mini={mini} className={className} style={style}>
      <Shadow />
      <g className="roll">
        <g className="body-all">
          <g className="tail" style={{ transformOrigin: '160px 196px' }}>
            <path d="M158 198c36 2 50-30 40-62-5-16-20-18-18-4" fill="none" stroke="#EDA87A" strokeWidth="17" strokeLinecap="round" />
            <path d="M158 198c36 2 50-30 40-62" fill="none" stroke="#FFD8B5" strokeWidth="6" strokeLinecap="round" opacity=".8" />
          </g>
          <path d={KITTY_BODY} fill="url(#mg-kitty)" />
          <ellipse cx="120" cy="182" rx="30" ry="31" fill="url(#mg-belly)" />
          <g className="paws">
            <path d={KITTY_PAW_L} fill="url(#mg-paw)" />
            <path d={KITTY_PAW_R} fill="url(#mg-paw)" />
            <path d="M93 214v5M101 214v5M137 214v5M145 214v5" stroke="#E8B49A" strokeWidth="1.8" strokeLinecap="round" />
          </g>
          <g className="head" style={{ transformOrigin: '120px 160px' }}>
            <g className="ear-l" style={{ transformOrigin: '92px 70px' }}>
              <KittyEar />
            </g>
            <g className="ear-r" style={{ transformOrigin: '148px 70px' }}>
              {mirror(<KittyEar />)}
            </g>
            <path d={KITTY_HEAD} fill="url(#mg-kitty)" />
            <path d="M120 50v13M107 53c2 5 4 9 5 12M133 53c-2 5-4 9-5 12" stroke="#EAA071" strokeWidth="4" strokeLinecap="round" opacity=".75" />
            <ellipse cx="96" cy="72" rx="20" ry="10" fill="#fff" opacity=".28" transform="rotate(-18 96 72)" />
            <Eyes l={[94, 104]} r={[146, 104]} rad={15} iris="url(#mg-eye-green)" state={state} />
            <Cheeks l={[76, 127]} r={[164, 127]} />
            <ellipse cx="110" cy="130" rx="12" ry="9" fill="#FFF4EA" opacity=".9" />
            <ellipse cx="130" cy="130" rx="12" ry="9" fill="#FFF4EA" opacity=".9" />
            <path d="M112 119q8-5 16 0-3 7-8 8-5-1-8-8z" fill="url(#mg-nose)" />
            <Mouth x={120} y={127} state={state} />
            <Whiskers y={128} x0={88} />
          </g>
          {state === 'sleep' && <Sleepy x={176} y={52} />}
        </g>
      </g>
    </Frame>
  )
}

// ---------- Песик Бублик ----------
const PUP_HEAD = fluff(120, 104, 62, 54, 26, 2.6)
const PUP_BODY = fluff(120, 174, 50, 44, 20, 2.6)
const PUP_CHEST = fluff(120, 172, 26, 30, 12, 2)
const PUP_PAW_L = fluff(98, 214, 16, 10, 10, 1.4)
const PUP_PAW_R = fluff(142, 214, 16, 10, 10, 1.4, 0.3)

function PuppyEar() {
  return (
    <>
      <path d="M80 64C56 58 40 82 44 116c2 18 16 24 26 14 10-10 14-34 16-52z" fill="url(#mg-puppy-ear)" />
      <path d="M62 82c-6 10-8 22-6 34" stroke="#fff" strokeWidth="3" opacity=".25" strokeLinecap="round" fill="none" />
    </>
  )
}

export function Puppy({ state = 'idle', mini, className, style }: PetProps) {
  const tongue = state === 'happy' || state === 'pet' || state === 'hop'
  return (
    <Frame id="puppy" state={state} mini={mini} className={className} style={style}>
      <Shadow />
      <g className="roll">
        <g className="body-all">
          <g className="tail" style={{ transformOrigin: '162px 192px' }}>
            <path d="M160 194c24-2 34-20 30-40" fill="none" stroke="#E2A468" strokeWidth="15" strokeLinecap="round" />
            <path d="M160 194c24-2 34-20 30-40" fill="none" stroke="#FAD7A3" strokeWidth="6" strokeLinecap="round" opacity=".8" />
          </g>
          <path d={PUP_BODY} fill="url(#mg-puppy)" />
          <path d={PUP_CHEST} fill="url(#mg-cream)" />
          <g className="paws">
            <path d={PUP_PAW_L} fill="url(#mg-cream)" />
            <path d={PUP_PAW_R} fill="url(#mg-cream)" />
          </g>
          <g className="head" style={{ transformOrigin: '120px 158px' }}>
            <path d="M82 146q38 22 76 0" fill="none" stroke="#FF8FB1" strokeWidth="9" strokeLinecap="round" />
            <path d={HEART_D} transform="translate(111 152) scale(.18)" fill="url(#mg-gold)" />
            <path d={PUP_HEAD} fill="url(#mg-puppy)" />
            <ellipse cx="98" cy="72" rx="20" ry="10" fill="#fff" opacity=".3" transform="rotate(-18 98 72)" />
            <g className="ear-l" style={{ transformOrigin: '80px 70px' }}>
              <PuppyEar />
            </g>
            <g className="ear-r" style={{ transformOrigin: '160px 70px' }}>
              {mirror(<PuppyEar />)}
            </g>
            <ellipse cx="120" cy="128" rx="31" ry="23" fill="url(#mg-cream)" />
            <ellipse cx="94" cy="83" rx="6" ry="3.4" fill="#D9955A" />
            <ellipse cx="146" cy="83" rx="6" ry="3.4" fill="#D9955A" />
            <Eyes l={[96, 101]} r={[144, 101]} rad={13.5} state={state} />
            <Cheeks l={[76, 124]} r={[164, 124]} />
            <ellipse cx="120" cy="117" rx="11.5" ry="8" fill="url(#mg-nose-dark)" />
            <ellipse cx="116" cy="114" rx="4" ry="2.4" fill="#fff" opacity=".55" />
            <Mouth x={120} y={127} w={8} state={state} tongue={tongue} />
            {state === 'heart' && <path d={HEART_D} transform="translate(102 128) scale(.36)" fill="url(#mg-heart)" className="carry-heart" />}
          </g>
          {state === 'sleep' && <Sleepy x={176} y={50} />}
        </g>
      </g>
    </Frame>
  )
}

// ---------- Кролик Пух ----------
const BUN_HEAD = fluff(120, 118, 54, 47, 24, 2.4)
const BUN_BODY = fluff(120, 182, 46, 38, 18, 2.4)
const BUN_TAIL = fluff(166, 196, 13, 12, 9, 2.2)

function BunnyEar({ cx, cy, rot }: { cx: number; cy: number; rot: number }) {
  return (
    <g transform={`rotate(${rot} ${cx} ${cy + 36})`}>
      <ellipse cx={cx} cy={cy} rx="15" ry="42" fill="url(#mg-bunny)" />
      <ellipse cx={cx} cy={cy + 4} rx="7.5" ry="31" fill="url(#mg-pink-in)" />
    </g>
  )
}

export function Bunny({ state = 'idle', mini, className, style }: PetProps) {
  return (
    <Frame id="bunny" state={state} mini={mini} className={className} style={style}>
      <Shadow rx={64} />
      <g className="roll">
        <g className="body-all">
          <path d={BUN_TAIL} fill="#fff" />
          <path d={BUN_BODY} fill="url(#mg-bunny)" />
          <ellipse cx="120" cy="188" rx="26" ry="24" fill="#fff" opacity=".85" />
          <ellipse cx="96" cy="215" rx="20" ry="9" fill="url(#mg-bunny)" />
          <ellipse cx="144" cy="215" rx="20" ry="9" fill="url(#mg-bunny)" />
          <ellipse cx="108" cy="198" rx="8" ry="7" fill="#fff" />
          <ellipse cx="132" cy="198" rx="8" ry="7" fill="#fff" />
          <g className="head" style={{ transformOrigin: '120px 160px' }}>
            <g className="ear-l" style={{ transformOrigin: '104px 84px' }}>
              <BunnyEar cx={100} cy={46} rot={-12} />
            </g>
            <g className="ear-r" style={{ transformOrigin: '136px 84px' }}>
              <BunnyEar cx={140} cy={46} rot={16} />
            </g>
            <path d={BUN_HEAD} fill="url(#mg-bunny)" />
            <ellipse cx="100" cy="92" rx="18" ry="9" fill="#fff" opacity=".6" transform="rotate(-18 100 92)" />
            <Eyes l={[99, 114]} r={[141, 114]} rad={12.5} state={state} />
            <Cheeks l={[82, 133]} r={[158, 133]} rx={13} ry={8} />
            <path className="nose" d="M114 128q6-4 12 0-3 5-6 6-3-1-6-6z" fill="url(#mg-nose)" style={{ transformOrigin: '120px 130px' }} />
            <Mouth x={120} y={135} w={6} state={state} />
            {state !== 'talk' && state !== 'eat' && <rect x="116.5" y="141" width="7" height="6.5" rx="2" fill="#fff" stroke="#E9DDEF" strokeWidth="1" />}
            <Whiskers y={134} x0={94} len={24} color="#CDBBDD" />
          </g>
          {state === 'sleep' && <Sleepy x={170} y={70} />}
        </g>
      </g>
    </Frame>
  )
}

// ---------- Капібара Дзень ----------
const CAPY_BODY = fluff(130, 178, 74, 44, 26, 2.2)

function CapyEyes({ state }: { state: PetState }) {
  const m = eyeMode(state)
  if (m !== 'open')
    return (
      <g className="eyes">
        <Eye cx={86} cy={104} r={8} mode={m} ink="#4A3326" />
        <Eye cx={134} cy={104} r={8} mode={m} ink="#4A3326" />
      </g>
    )
  // спокійні напівзаплющені очі
  return (
    <g className="eyes">
      {[86, 134].map((x) => (
        <g key={x}>
          <circle cx={x} cy={105} r="7" fill="#2B1C14" />
          <circle cx={x - 2} cy={107} r="1.8" fill="#fff" opacity=".8" />
          <path d={`M${x - 9} ${105}a9 8 0 0 1 18 0z`} fill="#C99B72" />
          <path d={`M${x - 8.5} ${104.5}h17`} stroke="#5A3E2C" strokeWidth="2.4" strokeLinecap="round" />
        </g>
      ))}
    </g>
  )
}

export function Capy({ state = 'idle', mini, className, style }: PetProps) {
  return (
    <Frame id="capy" state={state} mini={mini} className={className} style={style}>
      <Shadow rx={82} />
      <g className="roll">
        <g className="body-all">
          <path d={CAPY_BODY} fill="url(#mg-capy)" />
          <ellipse cx="160" cy="160" rx="30" ry="12" fill="#fff" opacity=".18" transform="rotate(-8 160 160)" />
          <ellipse cx="94" cy="214" rx="15" ry="9" fill="#9C7150" />
          <ellipse cx="160" cy="214" rx="15" ry="9" fill="#9C7150" />
          <g className="head" style={{ transformOrigin: '110px 160px' }}>
            <circle cx="70" cy="74" r="11" fill="#B88B63" />
            <circle cx="70" cy="75" r="5.5" fill="#8A6246" />
            <circle cx="150" cy="74" r="11" fill="#B88B63" />
            <circle cx="150" cy="75" r="5.5" fill="#8A6246" />
            <rect x="56" y="64" width="108" height="106" rx="48" fill="url(#mg-capy)" />
            <ellipse cx="88" cy="82" rx="20" ry="8" fill="#fff" opacity=".22" transform="rotate(-12 88 82)" />
            <rect x="74" y="118" width="72" height="50" rx="25" fill="url(#mg-capy-snout)" />
            <ellipse cx="99" cy="130" rx="4.2" ry="3" fill="#4A3324" />
            <ellipse cx="121" cy="130" rx="4.2" ry="3" fill="#4A3324" />
            <ellipse cx="98" cy="123" rx="11" ry="3" fill="#fff" opacity=".22" />
            {state === 'eat' || state === 'talk' ? (
              <ellipse cx="110" cy="152" rx="7" ry="5" fill="#4A2F22" className="munch" />
            ) : (
              <path d="M101 151q9 6 18 0" fill="none" stroke="#3E2A1E" strokeWidth="2.6" strokeLinecap="round" />
            )}
            <CapyEyes state={state} />
            <Cheeks l={[74, 124]} r={[146, 124]} rx={11} ry={7} />
            <g className="orange">
              <Orange x={110} y={57} r={17} />
            </g>
          </g>
          {state === 'sleep' && <Sleepy x={178} y={70} />}
        </g>
      </g>
    </Frame>
  )
}

// ---------- Хом’ячок Пончик ----------
const HAM_BODY = fluff(120, 156, 68, 62, 30, 2.6)
const HAM_BELLY = fluff(120, 178, 46, 40, 18, 2)

export function Hamster({ state = 'idle', cheeks = 0, mini, className, style }: PetProps) {
  const s = 1 + Math.min(5, cheeks) * 0.15
  const cheek = (x: number) => (
    <g className="ham-cheek" style={{ transform: `scale(${s})` }}>
      <ellipse cx={x} cy={160} rx="21" ry="18" fill="url(#mg-cream)" />
      <ellipse cx={x} cy={162} rx="13" ry="8" fill="url(#mg-cheek)" />
    </g>
  )
  return (
    <Frame id="hamster" state={state} mini={mini} className={className} style={style}>
      <Shadow rx={70} />
      <g className="roll">
        <g className="body-all">
          <g className="ear-l" style={{ transformOrigin: '80px 104px' }}>
            <circle cx="80" cy="100" r="16" fill="url(#mg-hamster)" />
            <circle cx="80" cy="101" r="9" fill="url(#mg-pink-in)" />
          </g>
          <g className="ear-r" style={{ transformOrigin: '160px 104px' }}>
            <circle cx="160" cy="100" r="16" fill="url(#mg-hamster)" />
            <circle cx="160" cy="101" r="9" fill="url(#mg-pink-in)" />
          </g>
          <path d={HAM_BODY} fill="url(#mg-hamster)" />
          <path d={HAM_BELLY} fill="url(#mg-cream)" />
          <ellipse cx="96" cy="114" rx="22" ry="10" fill="#fff" opacity=".35" transform="rotate(-20 96 114)" />
          <ellipse cx="100" cy="216" rx="13" ry="7" fill="#FFC6AE" />
          <ellipse cx="140" cy="216" rx="13" ry="7" fill="#FFC6AE" />
          <g className="head">
            {cheek(80)}
            {cheek(160)}
            <Eyes l={[101, 134]} r={[139, 134]} rad={10.5} state={state} />
            <ellipse cx="120" cy="149" rx="5.5" ry="3.8" fill="url(#mg-nose)" />
            <Mouth x={120} y={153} w={6} state={state} />
            <Whiskers y={150} x0={100} len={20} color="#E1B08E" />
          </g>
          <g className="hands">
            <ellipse cx="120" cy="186" rx="7" ry="10" fill="#9C8B7C" transform="rotate(18 120 186)" />
            <path d="M117 178q4 8 1 17M123 177q2 8-2 18" stroke="#E9DED2" strokeWidth="1.5" fill="none" transform="rotate(18 120 186)" />
            <ellipse cx="110" cy="186" rx="7.5" ry="6.5" fill="url(#mg-paw)" />
            <ellipse cx="130" cy="186" rx="7.5" ry="6.5" fill="url(#mg-paw)" />
          </g>
          {state === 'sleep' && <Sleepy x={178} y={84} />}
        </g>
      </g>
    </Frame>
  )
}

// ---------- Маленька панда ----------
const PANDA_HEAD = fluff(120, 104, 62, 52, 26, 2.4)
const PANDA_BODY = fluff(120, 176, 52, 44, 20, 2.4)

export function Panda({ state = 'idle', mini, className, style }: PetProps) {
  const m = eyeMode(state)
  return (
    <Frame id="panda" state={state} mini={mini} className={className} style={style}>
      <Shadow />
      <g className="roll">
        <g className="body-all">
          <path d={PANDA_BODY} fill="url(#mg-panda-w)" />
          <ellipse cx="94" cy="212" rx="20" ry="13" fill="url(#mg-panda-d)" />
          <ellipse cx="146" cy="212" rx="20" ry="13" fill="url(#mg-panda-d)" />
          <g className="hug-heart" style={{ transformOrigin: '120px 178px' }}>
            <path d={HEART_D} transform="translate(99 156) scale(.42)" fill="url(#mg-heart)" />
            <ellipse cx="110" cy="164" rx="5" ry="3" fill="#fff" opacity=".5" transform="rotate(-30 110 164)" />
          </g>
          <ellipse cx="92" cy="174" rx="15" ry="25" fill="url(#mg-panda-d)" transform="rotate(-38 92 174)" />
          <ellipse cx="148" cy="174" rx="15" ry="25" fill="url(#mg-panda-d)" transform="rotate(38 148 174)" />
          <g className="head" style={{ transformOrigin: '120px 158px' }}>
            <g className="ear-l" style={{ transformOrigin: '74px 70px' }}>
              <circle cx="72" cy="64" r="19" fill="url(#mg-panda-d)" />
            </g>
            <g className="ear-r" style={{ transformOrigin: '166px 70px' }}>
              <circle cx="168" cy="64" r="19" fill="url(#mg-panda-d)" />
            </g>
            <path d={PANDA_HEAD} fill="url(#mg-panda-w)" />
            <ellipse cx="96" cy="72" rx="20" ry="9" fill="#fff" opacity=".7" transform="rotate(-18 96 72)" />
            <ellipse cx="93" cy="106" rx="15" ry="19" fill="url(#mg-panda-d)" transform="rotate(-28 93 106)" />
            <ellipse cx="147" cy="106" rx="15" ry="19" fill="url(#mg-panda-d)" transform="rotate(28 147 106)" />
            {m === 'open' ? (
              <g className="eyes">
                <Eye cx={95} cy={104} r={8.5} mode="open" />
                <Eye cx={145} cy={104} r={8.5} mode="open" />
              </g>
            ) : (
              <Eyes l={[95, 106]} r={[145, 106]} rad={8} state={state} ink="#F4EEF8" />
            )}
            <Cheeks l={[80, 130]} r={[160, 130]} rx={12} ry={7} />
            <ellipse cx="120" cy="123" rx="9" ry="6" fill="url(#mg-nose-dark)" />
            <ellipse cx="117" cy="121" rx="3" ry="1.8" fill="#fff" opacity=".5" />
            <Mouth x={120} y={130} w={6} state={state} />
          </g>
          {state === 'sleep' && <Sleepy x={176} y={52} />}
        </g>
      </g>
    </Frame>
  )
}

export function Pet({ id, ...p }: PetProps & { id: PetId }) {
  switch (id) {
    case 'kitty':
      return <Kitty {...p} />
    case 'puppy':
      return <Puppy {...p} />
    case 'bunny':
      return <Bunny {...p} />
    case 'capy':
      return <Capy {...p} />
    case 'hamster':
      return <Hamster {...p} />
    case 'panda':
      return <Panda {...p} />
  }
}
