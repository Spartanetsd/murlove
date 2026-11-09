// Інтерактивна сцена з пухнастиком: гладити, торкатися, тримати, годувати, «дай лапку».
import { useEffect, useImperativeHandle, useRef, useState, type Ref, type CSSProperties } from 'react'
import { Pet, type PetId, type PetState } from './pets'
import { PETS } from './content'
import { useGestures } from './ui'
import { play, startPurr, stopPurr, purrFor } from './sound'
import { haptic } from './device'
import { burst, floatUp, centerOf } from './fx'
import { bump, choice, unlockSecret, isCalm } from './store'

export interface PetStageApi {
  feed: (i: number, from: Element | null) => void
  paw: () => void
}

type Bubble = { text: string; k: number } | null

export function PetStage({ id, ref, compact, cushion }: { id: PetId; ref?: Ref<PetStageApi>; compact?: boolean; cushion?: boolean }) {
  const def = PETS[id]
  const [st, setSt] = useState<PetState>('idle')
  const [cheeks, setCheeks] = useState(0)
  const [bubble, setBubble] = useState<Bubble>(null)
  const [fidget, setFidget] = useState('')
  const [breath, setBreath] = useState<'in' | 'out' | null>(null)
  const stRef = useRef(st)
  stRef.current = st
  const timers = useRef<number[]>([])
  const bubbleTimer = useRef(0)
  const petRef = useRef<HTMLDivElement>(null)
  const strokeSaid = useRef(0)
  const bellyArmed = useRef(false)
  const cheeksRef = useRef(0)

  const later = (fn: () => void, ms: number) => {
    const t = window.setTimeout(fn, ms)
    timers.current.push(t)
    return t
  }
  const clearAll = () => {
    timers.current.forEach(clearTimeout)
    timers.current = []
  }

  // скидання при зміні пухнастика
  useEffect(() => {
    clearAll()
    stopPurr()
    setSt('idle')
    setCheeks(0)
    cheeksRef.current = 0
    bellyArmed.current = false
    setBubble(null)
    setBreath(null)
    return () => {
      clearAll()
      stopPurr()
      clearTimeout(bubbleTimer.current)
    }
  }, [id])

  // маленькі випадкові рухи, поки пухнастик відпочиває
  useEffect(() => {
    let t = 0
    const loop = () => {
      t = window.setTimeout(() => {
        if (stRef.current === 'idle' && !isCalm()) {
          const f = choice(['ear', 'look', 'tail', 'bob'])
          setFidget(f)
          window.setTimeout(() => setFidget(''), 1300)
        }
        loop()
      }, 5500 + Math.random() * 5000)
    }
    loop()
    return () => clearTimeout(t)
  }, [])

  const say = (text: string, ms = 3200) => {
    clearTimeout(bubbleTimer.current)
    setBubble((b) => ({ text, k: (b?.k ?? 0) + 1 }))
    bubbleTimer.current = window.setTimeout(() => setBubble(null), ms)
  }

  const temp = (s: PetState, ms: number, then: PetState = 'idle') => {
    clearAll()
    setSt(s)
    later(() => setSt(then), ms)
  }

  const heartsAtPet = (n = 10, kinds: ('heart' | 'sparkle' | 'star' | 'paw')[] = ['heart', 'sparkle']) => {
    const [x, y] = centerOf(petRef.current)
    burst(x, y - 30, { count: n, kinds, spread: 120 })
  }

  const startBreathing = () => {
    clearAll()
    setSt('sleep')
    say(def.hold, 2500)
    unlockSecret('breath')
    let i = 0
    const step = () => {
      if (i >= 6) {
        setBreath(null)
        setSt('happy')
        say('Молодчинка. Тепер ти спокійна, як капібара 🧡', 3500)
        later(() => setSt('idle'), 1500)
        return
      }
      const phase = i % 2 === 0 ? 'in' : 'out'
      setBreath(phase)
      if (phase === 'in') play('bowl')
      i++
      later(step, 4000)
    }
    step()
  }

  const gestures = useGestures({
    onTap(x, y) {
      haptic('light')
      burst(x, y, { count: 6, kinds: ['heart', 'sparkle'], spread: 70, dim: [12, 22] })
      if (breath) return
      const cur = stRef.current
      if (id === 'panda') {
        if (cur === 'sleep') {
          play('pop')
          temp('happy', 1400)
          say('Ой! Я не спала. Майже.')
        } else {
          play('yawn')
          clearAll()
          setSt('sleep')
          say('Позіхає… і засинає, обіймаючи сердечко.')
          unlockSecret('panda')
          later(() => play('snore'), 1600)
        }
        return
      }
      if (cur === 'sleep') {
        play('pop')
        temp('happy', 1300)
        say(id === 'puppy' ? 'Гав? Я не спав! Я охороняв.' : 'Ой, я тут! Не сплю!')
        return
      }
      play(def.sounds.tap)
      if (id === 'kitty') {
        clearAll()
        setSt('talk')
        later(() => setSt('happy'), 650)
        later(() => setSt('idle'), 1600)
      } else if (id === 'puppy') {
        temp('happy', 1500)
        setFidget('wag')
        later(() => setFidget(''), 1500)
      } else temp(def.tapState, id === 'bunny' ? 800 : 1300)
      say(choice(def.tap))
    },
    onStroke(x, y, total) {
      if (breath) return
      floatUp(x, y - 10, Math.random() < 0.8 ? 'heart' : 'sparkle')
      const cur = stRef.current
      if (cur !== 'pet' && cur !== 'belly' && !(id === 'panda' && cur === 'sleep')) {
        clearAll()
        setSt('pet')
        strokeSaid.current = 0
        if (id === 'kitty') startPurr(1)
        else play('chime')
        if (id === 'puppy') setFidget('wag')
      }
      if (performance.now() - strokeSaid.current > 2600) {
        strokeSaid.current = performance.now()
        if (stRef.current !== 'belly') say(choice(def.pet), 2400)
        if (id !== 'kitty') haptic('light')
      }
      if (id === 'kitty' && total > 1800 && stRef.current !== 'belly' && !bellyArmed.current) {
        bellyArmed.current = true
        setSt('belly')
        say('Почухай животик! 🐾', 3000)
        unlockSecret('belly')
        haptic('medium')
      }
    },
    onStrokeEnd() {
      stopPurr()
      setFidget('')
      const cur = stRef.current
      if (cur === 'belly') {
        later(() => {
          setSt('idle')
          bellyArmed.current = false
        }, 3800)
        if (id === 'kitty') purrFor(2.4, 0.8)
      } else if (!(id === 'panda' && cur === 'sleep')) temp('happy', 900)
    },
    onHold() {
      if (breath) return
      haptic('medium')
      if (id === 'capy') {
        startBreathing()
        return
      }
      if (def.sounds.hold === 'purr') purrFor(2.2)
      else play(def.sounds.hold)
      if (def.holdState === 'sleep') {
        clearAll()
        setSt('sleep')
        if (id === 'puppy') {
          unlockSecret('sleepy')
          later(() => play('snore'), 3200)
        }
        if (id === 'hamster') later(() => setSt('idle'), 4200)
      } else temp(def.holdState, 1600)
      say(def.hold, 3400)
    },
  })

  useImperativeHandle(ref, () => ({
    feed(i, from) {
      const t = def.treats[i]
      const [fx, fy] = centerOf(from)
      const [tx, ty] = centerOf(petRef.current)
      const layer = document.getElementById('fx')
      const fly = document.createElement('div')
      fly.className = 'treat-fly'
      fly.textContent = t.emoji
      fly.style.left = fx - 20 + 'px'
      fly.style.top = fy - 20 + 'px'
      layer?.appendChild(fly)
      play('whoosh')
      const calm = isCalm()
      const anim = fly.animate(
        [
          { transform: 'translate(0,0) scale(1)', opacity: 1 },
          { transform: `translate(${(tx - fx) * 0.5}px,${(ty - fy) * 0.5 - 80}px) scale(1.3)`, opacity: 1, offset: 0.5 },
          { transform: `translate(${tx - fx}px,${ty - fy + 10}px) scale(.3)`, opacity: 0 },
        ],
        { duration: calm ? 250 : 650, easing: 'cubic-bezier(.3,.7,.4,1)' },
      )
      anim.onfinish = () => {
        fly.remove()
        clearAll()
        setSt('eat')
        play('nom')
        haptic('light')
        bump('feeds')
        if (id === 'hamster') {
          const n = Math.min(5, cheeksRef.current + 1)
          cheeksRef.current = n
          setCheeks(n)
          if (n >= 5) {
            say('Повні щічки! Пончик щасливий, як ніколи 🐹', 3400)
            unlockSecret('cheeks')
            heartsAtPet(14, ['heart', 'star'])
            later(() => {
              cheeksRef.current = 0
              setCheeks(0)
              play('squeak')
              say('Пончик заховав запаси в нірку. Можна знову годувати!', 3000)
            }, 3800)
          } else say(n === 1 ? t.line : choice(['Хрум! Ще влізе!', 'Щічки заповнені на ' + n * 20 + '%', 'Майже повні… але ще трошки можна!', t.line]))
        } else say(t.line)
        later(() => setSt('happy'), 1300)
        later(() => setSt('idle'), 2200)
        later(() => heartsAtPet(6), 1300)
      }
    },
    paw() {
      clearAll()
      setBreath(null)
      play(def.sounds.paw)
      haptic('medium')
      heartsAtPet(12, ['heart', 'paw', 'sparkle'])
      setSt(id === 'puppy' ? 'heart' : 'happy')
      later(() => setSt('idle'), 2600)
      say(choice(def.paw), 4200)
    },
  }))

  const style = { '--bg1': def.bg[0], '--bg2': def.bg[1] } as CSSProperties
  return (
    <div className={`stage stage-${id}${compact ? ' compact' : ''}${fidget ? ' fg-' + fidget : ''}`} style={style}>
      <div className="stage-glow" />
      {cushion && <div className="cushion" />}
      <div className="pet-hit" ref={petRef} {...gestures}>
        <Pet id={id} state={st} cheeks={cheeks} />
      </div>
      {bubble && (
        <div className="bubble" key={bubble.k}>
          {bubble.text}
        </div>
      )}
      {breath && (
        <div className={'breath ' + breath} aria-live="polite">
          <div className="breath-ring" />
          <span>{breath === 'in' ? 'Вдих…' : 'Видих…'}</span>
        </div>
      )}
    </div>
  )
}
