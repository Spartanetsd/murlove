// Каркас застосунку «МурLove ❤️ Твій Ігор»
import { useEffect, useRef, useState } from 'react'
import { SvgDefs, CloudSvg, HeartSvg, Icon } from './art'
import { Kitty } from './pets'
import { PERSONAL, SECRETS } from './content'
import { HomeScreen, dayPart } from './HomeScreen'
import { PetsScreen } from './PetsScreen'
import { LaughScreen } from './LaughScreen'
import { HugScreen } from './HugScreen'
import { GiftScreen } from './GiftScreen'
import { LoveScreen } from './LoveScreen'
import { SettingsSheet } from './SettingsSheet'
import { TabBar, Toasts, Overlay, Btn, shareText, type Tab } from './ui'
import { play, unlockAudio } from './sound'
import { haptic, listenShake, motionAllowed, requestShakePermission, shakeNeedsPermission } from './device'
import { burst, rain, centerOf, setFxLayer } from './fx'
import { onSecret, toast, unlockSecret, update, useCalm, useStore, setSetting } from './store'

export default function App() {
  const [tab, setTab] = useState<Tab>('home')
  const [settings, setSettings] = useState(false)
  const [confession, setConfession] = useState(false)
  const calm = useCalm()
  const welcomed = useStore((s) => s.welcomed)
  const sound = useStore((s) => s.settings.sound)
  const shake = useStore((s) => s.settings.shake)
  const [part, setPart] = useState(dayPart)
  const taps = useRef<number[]>([])

  useEffect(() => {
    document.documentElement.classList.toggle('calm', calm)
  }, [calm])

  // шар для частинок
  useEffect(() => {
    setFxLayer(document.getElementById('fx'))
    return () => setFxLayer(null)
  }, [])

  // розблокування звуку після першого дотику (вимога iOS)
  useEffect(() => {
    const h = () => unlockAudio()
    const evs = ['touchend', 'pointerup', 'click', 'keydown']
    evs.forEach((e) => document.addEventListener(e, h, { capture: true, passive: true }))
    return () => evs.forEach((e) => document.removeEventListener(e, h, { capture: true }))
  }, [])

  // ранок / вечір
  useEffect(() => {
    const check = () => {
      const p = dayPart()
      setPart(p)
      if (p === 'morning') unlockSecret('morning')
      if (p === 'evening') unlockSecret('evening')
    }
    check()
    const t = setInterval(check, 60000)
    return () => clearInterval(t)
  }, [])

  // відкриті секрети
  useEffect(
    () =>
      onSecret((id) => {
        const s = SECRETS.find((x) => x.id === id)
        if (!s) return
        setTimeout(() => {
          toast(`Відкрито секрет: ${s.title}`, '✨')
          play('sparkle')
        }, 400)
      }),
    [],
  )

  // трусіння телефона
  useEffect(() => {
    if (!shake) return
    let stop: (() => void) | null = null
    const attach = () => {
      stop = listenShake(() => {
        rain(['heart', 'star', 'petal'], 46)
        play('sparkle')
        haptic('strong')
        unlockSecret('shake')
      })
    }
    if (motionAllowed() || !shakeNeedsPermission()) attach()
    else {
      // на iOS дозвіл можна попросити лише в обробнику дотику
      const ask = async () => {
        document.removeEventListener('touchend', ask)
        const r = await requestShakePermission()
        if (r === 'granted') attach()
        else setSetting('shake', false)
      }
      document.addEventListener('touchend', ask, { once: true })
      return () => {
        document.removeEventListener('touchend', ask)
        stop?.()
      }
    }
    return () => stop?.()
  }, [shake])

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [tab])

  const heartTap = (el: Element | null) => {
    unlockAudio()
    play('pop')
    haptic('light')
    const [x, y] = centerOf(el)
    burst(x, y, { count: 7, kinds: ['heart'], spread: 70, dim: [12, 22] })
    const now = Date.now()
    taps.current = [...taps.current.filter((t) => now - t < 3000), now]
    if (taps.current.length >= 5) {
      taps.current = []
      openConfession()
    }
  }

  const openConfession = () => {
    setConfession(true)
    unlockSecret('heart5')
    play('tada')
    setTimeout(() => play('hug'), 600)
    haptic('hug')
    rain(['heart', 'petal'], 40)
  }

  const enter = () => {
    unlockAudio()
    haptic('medium')
    setTimeout(() => play('sparkle'), 60)
    burst(window.innerWidth / 2, window.innerHeight * 0.6, { count: 22, kinds: ['heart', 'sparkle', 'star'], spread: 200 })
    update((s) => ({ ...s, welcomed: true }))
  }

  return (
    <div className={'app' + (calm ? ' calm' : '') + (part === 'evening' ? ' evening' : '')}>
      <SvgDefs />
      <Sky evening={part === 'evening'} />

      <main className="screen" key={tab}>
        {tab === 'home' && <HomeScreen heartTap={heartTap} />}
        {tab === 'pets' && <PetsScreen />}
        {tab === 'laugh' && <LaughScreen />}
        {tab === 'hug' && <HugScreen />}
        {tab === 'gifts' && <GiftScreen />}
        {tab === 'love' && <LoveScreen heartTap={heartTap} />}
      </main>

      <div className="status-fade" />
      <div className="corner">
        <button
          className="icon-btn glass"
          aria-label={sound ? 'Вимкнути звук' : 'Увімкнути звук'}
          onClick={() => {
            unlockAudio()
            setSetting('sound', !sound)
            if (!sound) setTimeout(() => play('chime'), 60)
            haptic('light')
          }}
        >
          <Icon name={sound ? 'sound' : 'mute'} />
        </button>
        <button
          className="icon-btn glass"
          aria-label="Налаштування"
          onClick={() => {
            unlockAudio()
            play('tap')
            setSettings(true)
          }}
        >
          <Icon name="gear" />
        </button>
      </div>

      <TabBar tab={tab} onChange={setTab} />
      <SettingsSheet open={settings} onClose={() => setSettings(false)} />
      <Toasts />

      {confession && (
        <Overlay className="confession" onClose={() => setConfession(false)}>
          <div className="letter">
            <div className="letter-seal">
              <HeartSvg />
            </div>
            {PERSONAL.confession.map((l, i) => (
              <p key={i} className={i === 0 ? 'letter-hi' : ''} style={{ animationDelay: 0.3 + i * 0.55 + 's' }}>
                {l}
              </p>
            ))}
            <p className="letter-sign" style={{ animationDelay: 0.3 + PERSONAL.confession.length * 0.55 + 's' }}>
              {PERSONAL.confessionSign}
            </p>
            <div className="letter-actions">
              <Btn
                onClick={() => {
                  play('kisses')
                  rain(['heart'], 30)
                  shareText('МурLove', 'Я теж тебе кохаю ❤️ — Мар’яна', () => toast('Текст скопійовано — надішли його Ігорю 💌'))
                }}
              >
                Я теж тебе кохаю ❤️
              </Btn>
              <Btn kind="ghost" onClick={() => setConfession(false)}>
                Закрити
              </Btn>
            </div>
          </div>
        </Overlay>
      )}

      {!welcomed && (
        <Overlay className="welcome">
          <div className="welcome-inner">
            <Kitty state="happy" className="welcome-kitty" />
            <h1>Мар’янко, це для тебе ❤️</h1>
            <p>Маленький світ, де на тебе завжди чекають пухнастики, обійми і любов від Ігоря.</p>
            <Btn className="cta" onClick={enter}>
              Відкрити 💝
            </Btn>
            <p className="muted small">Порада: увімкни звук — Мурка вміє муркотіти.</p>
          </div>
        </Overlay>
      )}
    </div>
  )
}

function Sky({ evening }: { evening: boolean }) {
  return (
    <div className="sky" aria-hidden="true">
      <CloudSvg className="cloud c1" />
      <CloudSvg className="cloud c2" />
      <CloudSvg className="cloud c3" />
      <div className="stars">
        {Array.from({ length: evening ? 22 : 10 }, (_, i) => (
          <i key={i} style={{ left: ((i * 47) % 97) + '%', top: ((i * 31) % 60) + '%', animationDelay: (i % 7) * 0.6 + 's' }} />
        ))}
      </div>
      <div className="floaties">
        {Array.from({ length: 7 }, (_, i) => (
          <i key={i} style={{ left: 6 + i * 14 + '%', animationDelay: i * 2.3 + 's', animationDuration: 16 + (i % 3) * 5 + 's' }}>
            {i % 3 === 0 ? '♡' : i % 3 === 1 ? '✦' : '♡'}
          </i>
        ))}
      </div>
    </div>
  )
}
