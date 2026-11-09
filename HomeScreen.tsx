// Головний екран «Привіт, моє сонечко!»
import { useRef, useState } from 'react'
import { PetStage } from './PetStage'
import { Pet } from './pets'
import { HeartSvg, HugPaw, Icon } from './art'
import { LOVE, MOODS, PERSONAL, SIGN, MORNING, EVENING, type MoodId } from './content'
import { Btn, Overlay } from './ui'
import { play, unlockAudio } from './sound'
import { haptic, isStandalone, isIOS } from './device'
import { burst, rain, centerOf } from './fx'
import { bump, pick, useStore, update, isCalm } from './store'
import { MoodScene } from './MoodScene'

export function dayPart(): 'morning' | 'day' | 'evening' {
  const h = new Date().getHours()
  if (h >= 5 && h < 11) return 'morning'
  if (h >= 20 || h < 5) return 'evening'
  return 'day'
}

export function HomeScreen({ heartTap }: { heartTap: (el: Element | null) => void }) {
  const [msg, setMsg] = useState({ text: PERSONAL.homeMessage, sign: false, k: 0 })
  const [hugging, setHugging] = useState(false)
  const [mood, setMood] = useState<MoodId | null>(null)
  const btnRef = useRef<HTMLDivElement>(null)
  const logoRef = useRef<HTMLButtonElement>(null)
  const part = dayPart()
  const tipHidden = useStore((s) => s.installTipHidden)
  const [greet] = useState(() => {
    const list = part === 'evening' ? EVENING : MORNING
    return list[new Date().getDate() % list.length]
  })

  const getLove = () => {
    unlockAudio()
    if (hugging) return
    setHugging(true)
    haptic('hug')
    play('whoosh')
    setTimeout(() => play('kisses'), 420)
    setTimeout(() => play('chime'), 900)
    const [x, y] = centerOf(btnRef.current)
    burst(x, y, { count: 16, kinds: ['heart', 'sparkle'], spread: 160 })
    const idx = pick('love', LOVE.length)
    bump('loves')
    setTimeout(
      () => {
        setHugging(false)
        setMsg((m) => ({ text: LOVE[idx], sign: true, k: m.k + 1 }))
        rain(['heart'], 18)
      },
      isCalm() ? 500 : 1700,
    )
  }

  return (
    <div className="home">
      <header className="topline">
        <button
          className="logo"
          ref={logoRef}
          onClick={() => heartTap(logoRef.current)}
          aria-label="Сердечко МурLove"
        >
          <HeartSvg className="logo-heart" />
          <span>МурLove</span>
        </button>
      </header>

      <h1 className="hello">Привіт, моє сонечко!</h1>
      <div className={'greet ' + part}>
        <Pet id={greet.pet} mini className="greet-pet" state={part === 'evening' ? 'sleep' : 'happy'} />
        <p>
          {part === 'evening' ? '🌙 Добрий вечір! ' : part === 'morning' ? '☀️ Доброго ранку! ' : '💗 '}
          {part === 'day' ? 'Пухнастики дуже чекали на тебе. Погладь Мурку — вона муркоче!' : greet.text}
        </p>
      </div>

      <PetStage id="kitty" cushion />
      <p className="hint">Торкнися · погладь пальчиком · потримай</p>

      <section className="card love-card glass">
        <p key={msg.k} className="love-text">
          {msg.text}
        </p>
        {msg.sign && <p className="sign">{SIGN}</p>}
      </section>

      <div ref={btnRef} className="cta-wrap">
        <Btn className="cta" onClick={getLove}>
          Отримати любов ❤️
        </Btn>
      </div>

      <section className="mood">
        <h2>Як почувається моє сонечко?</h2>
        <div className="mood-grid">
          {MOODS.map((m) => (
            <button
              key={m.id}
              className={'mood-btn mood-' + m.id}
              onClick={() => {
                unlockAudio()
                haptic('light')
                play('pop')
                setMood(m.id)
              }}
            >
              <span className="mood-emoji">{m.emoji}</span>
              <Pet id={m.pet} mini className="mood-pet" state={m.id === 'tired' ? 'sleep' : 'happy'} />
              <span className="mood-label">{m.label}</span>
            </button>
          ))}
        </div>
      </section>

      {!tipHidden && !isStandalone() && (
        <section className="card glass install-tip">
          <div>
            <b>Встанови МурLove на головний екран</b>
            <p>
              {isIOS()
                ? 'У Safari натисни «Поділитися» → «На початковий екран». Так застосунок працюватиме навіть без інтернету.'
                : 'Відкрий меню браузера → «Встановити застосунок» або «Додати на головний екран».'}
            </p>
          </div>
          <button
            className="icon-btn"
            aria-label="Сховати підказку"
            onClick={() => update((s) => ({ ...s, installTipHidden: true }))}
          >
            <Icon name="close" />
          </button>
        </section>
      )}

      <p className="footer-sign">Зроблено з любов’ю для Мар’яни · Твій Ігор ❤️</p>

      {hugging && (
        <Overlay className="love-hug">
          <div className="love-hug-glow" />
          <div className="love-hug-stage">
            <HugPaw side="l" className="hug-paw l" />
            <HeartSvg className="love-hug-heart" />
            <HugPaw side="r" className="hug-paw r" />
          </div>
          <p className="love-hug-text">Обіймашки від Ігоря…</p>
        </Overlay>
      )}

      {mood && <MoodScene id={mood} onClose={() => setMood(null)} />}
    </div>
  )
}
