// «Ігор, обійми мене!» — велике серце, кілька різних обіймів, довгі обійми при утриманні.
import { useEffect, useRef, useState } from 'react'
import { HeartSvg, HugPaw, HEART_D } from './art'
import { Pet } from './pets'
import { PERSONAL, HUG_VARIANTS, HUG_HOLD } from './content'
import { play, unlockAudio, startHeartbeat, stopHeartbeat } from './sound'
import { haptic } from './device'
import { burst, rain, centerOf } from './fx'
import { bump, pick, useStore } from './store'

type Phase = 'idle' | 'hug' | 'hold'

export function HugScreen() {
  const [phase, setPhase] = useState<Phase>('idle')
  const [variant, setVariant] = useState(0)
  const [k, setK] = useState(0)
  const [showMsg, setShowMsg] = useState(false)
  const [holdText, setHoldText] = useState(HUG_HOLD[0])
  const hugs = useStore((s) => s.stats.hugs)
  const heartRef = useRef<HTMLButtonElement>(null)
  const timers = useRef<number[]>([])
  const holdTimer = useRef(0)
  const holdLoop = useRef(0)
  const down = useRef(false)
  const phaseRef = useRef<Phase>('idle')
  const setP = (p: Phase) => {
    phaseRef.current = p
    setPhase(p)
  }

  const clear = () => {
    timers.current.forEach(clearTimeout)
    timers.current = []
    clearTimeout(holdTimer.current)
    clearInterval(holdLoop.current)
  }
  useEffect(
    () => () => {
      clear()
      stopHeartbeat()
    },
    [],
  )

  const start = () => {
    unlockAudio()
    clear()
    down.current = true
    setVariant(pick('hug', HUG_VARIANTS.length))
    setK((x) => x + 1)
    setP('hug')
    setShowMsg(false)
    play('hug')
    haptic('hug')
    bump('hugs')
    const [x, y] = centerOf(heartRef.current)
    burst(x, y, { count: 14, kinds: ['heart', 'sparkle'], spread: 150 })
    timers.current.push(window.setTimeout(() => setShowMsg(true), 1500))
    holdTimer.current = window.setTimeout(() => {
      if (!down.current) return
      setP('hold')
      startHeartbeat()
      let i = 0
      setHoldText(HUG_HOLD[0])
      holdLoop.current = window.setInterval(() => {
        i++
        setHoldText(HUG_HOLD[i % HUG_HOLD.length])
        haptic('light')
        const [hx, hy] = centerOf(heartRef.current)
        burst(hx, hy, { count: 4, kinds: ['heart'], spread: 110, rise: 90 })
      }, 1600)
    }, 1100)
  }

  const release = () => {
    if (!down.current) return
    down.current = false
    clearTimeout(holdTimer.current)
    clearInterval(holdLoop.current)
    if (phaseRef.current === 'hold') {
      stopHeartbeat()
      play('chime')
      rain(['heart'], 24)
      setShowMsg(true)
      setP('hug')
    }
  }

  return (
    <div className={'hugs phase-' + phase}>
      <div className="hug-glow" />
      <h1 className="title">Ігор, обійми мене!</h1>
      <p className="sub">Натисни на серце. А якщо потримати — обійми будуть довшими.</p>

      <div className={'hug-stage v' + variant}>
        <button
          ref={heartRef}
          className="big-heart"
          aria-label="Ігор, обійми мене!"
          onPointerDown={start}
          onPointerUp={release}
          onPointerCancel={release}
          onPointerLeave={release}
          onContextMenu={(e) => e.preventDefault()}
        >
          <HeartSvg />
          <span className="big-heart-label">Обійми мене</span>
        </button>
        <div className="hug-decor" key={k}>
        {phase !== 'idle' && variant === 0 && (
          <>
            <HugPaw side="l" className="hug-paw l" />
            <HugPaw side="r" className="hug-paw r" />
          </>
        )}
        {phase !== 'idle' && variant === 1 && (
          <div className="heart-ring">
            {Array.from({ length: 12 }, (_, i) => (
              <svg key={i} viewBox="0 0 100 95" className="ring-heart" style={{ ['--a' as string]: i * 30 + 'deg', animationDelay: i * 0.04 + 's' }}>
                <path d={HEART_D} fill="url(#mg-heart)" />
              </svg>
            ))}
          </div>
        )}
        {phase !== 'idle' && variant === 2 && (
          <>
            <div className="mini-heart l">
              <HeartSvg />
              <span>І</span>
            </div>
            <div className="mini-heart r">
              <HeartSvg />
              <span>М</span>
            </div>
            <div className="flash" />
          </>
        )}
        {phase !== 'idle' && variant === 3 && (
          <>
            <div className="side-pet l">
              <Pet id="kitty" state="happy" />
            </div>
            <div className="side-pet r">
              <Pet id="puppy" state="happy" />
            </div>
          </>
        )}

        </div>
      </div>

      <div className="hug-msg-wrap" aria-live="polite">
        {phase === 'hold' && <p className="hold-text">{holdText}</p>}
        {showMsg && phase !== 'hold' && (
          <section className="card glass hug-msg" key={k}>
            <p className="hug-variant">{HUG_VARIANTS[variant]}</p>
            <p>{PERSONAL.hugMessage}</p>
          </section>
        )}
      </div>
      {hugs > 0 && <p className="hint">Обіймів отримано: {hugs}. Їх ніколи не буває забагато.</p>}
    </div>
  )
}
