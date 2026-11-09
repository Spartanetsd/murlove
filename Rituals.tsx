// Маленькі ритуали: записочка дня, 100 причин, Мирилка, «Засинай зі мною».
import { useEffect, useRef, useState } from 'react'
import { EnvelopeSvg, JarSvg, FlagSvg, PawStamp, HeartSvg, Icon } from './art'
import { Pet } from './pets'
import { DAILY, FORECAST, REASONS, APOLOGIES, TREATY, SIGNALS, NIGHT_LINES, PERSONAL, SIGN } from './content'
import { Overlay, Btn, shareText } from './ui'
import { play, unlockAudio, startPurr, stopPurr, purrActive, setNightMusic } from './sound'
import { haptic } from './device'
import { burst, rain, centerOf } from './fx'
import { useStore, update, unlockSecret, toast, pick, choice, getState, setSetting } from './store'

const MONTH = { day: 'numeric', month: 'long' } as const

function dayNumber(d = new Date()) {
  return Math.floor(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 86400000)
}
export function todayKey(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
function forecast(n: number) {
  const { sky, temp, extra } = FORECAST
  return `${sky[n % sky.length]}, ${temp[(n * 3) % temp.length]}, ${extra[(n * 7) % extra.length]}.`
}
const copied = () => toast('Текст скопійовано — надішли його Ігорю 💌')

// ---------- Записочка дня ----------
export function DailyNote() {
  const today = todayKey()
  const opened = useStore((s) => s.noteDay === today)
  const [open, setOpen] = useState(false)
  const [anim, setAnim] = useState(false)
  const ref = useRef<HTMLButtonElement>(null)
  const n = dayNumber()
  const note = DAILY[n % DAILY.length]
  const date = new Date().toLocaleDateString('uk-UA', MONTH)

  const openIt = () => {
    unlockAudio()
    if (anim) return
    setAnim(true)
    play('pop')
    haptic('medium')
    setTimeout(() => {
      const [x, y] = centerOf(ref.current)
      burst(x, y, { count: 14, kinds: ['heart', 'sparkle'], spread: 140 })
      play('sparkle')
      setOpen(true)
      update((s) => ({ ...s, noteDay: today }))
    }, 650)
  }

  if (open)
    return (
      <section className="note-paper">
        <p className="note-date">Записочка на {date}</p>
        <p className="note-text">{note}</p>
        <p className="note-fc">Прогноз любові: {forecast(n)}</p>
        <p className="sign">{SIGN}</p>
        <button
          className="note-fold"
          onClick={() => {
            setOpen(false)
            setAnim(false)
            play('tap')
          }}
        >
          Згорнути записочку
        </button>
      </section>
    )

  return (
    <button ref={ref} className={'envelope-btn glass' + (anim ? ' opening' : '')} onClick={openIt}>
      <EnvelopeSvg open={anim} className="env-svg" />
      <span className="env-label">
        <b>Записочка на {date}</b>
        <span>{opened ? 'Відкрий ще раз 💌' : 'Нова! Торкнись, щоб відкрити'}</span>
      </span>
      {!opened && <span className="badge">1</span>}
    </button>
  )
}

// ---------- Плитки «Для тебе» ----------
export type Ritual = 'reasons' | 'peace' | 'night'

export function ForYou({ onOpen }: { onOpen: (r: Ritual) => void }) {
  const read = useStore((s) => s.reasonsRead.length)
  const tiles: { k: Ritual; emoji: string; title: string; sub: string }[] = [
    { k: 'reasons', emoji: '🫙', title: '100 причин', sub: read ? `прочитано ${read}` : 'чому я тебе кохаю' },
    { k: 'peace', emoji: '🕊️', title: 'Мирилка', sub: 'коли щось не так' },
    { k: 'night', emoji: '🌙', title: 'Засинай зі мною', sub: 'колискова' },
  ]
  return (
    <section className="for-you">
      <h2>Для тебе</h2>
      <div className="fy-grid">
        {tiles.map((t) => (
          <button
            key={t.k}
            className={'fy-tile fy-' + t.k}
            onClick={() => {
              unlockAudio()
              play('pop')
              haptic('light')
              onOpen(t.k)
            }}
          >
            <span className="fy-emoji">{t.emoji}</span>
            <b>{t.title}</b>
            <span>{t.sub}</span>
          </button>
        ))}
      </div>
    </section>
  )
}

function CloseBtn({ onClose, light }: { onClose: () => void; light?: boolean }) {
  return (
    <button className={'icon-btn ov-close' + (light ? ' light' : ' glass')} onClick={onClose} aria-label="Закрити">
      <Icon name="close" />
    </button>
  )
}

// ---------- 100 причин ----------
export function ReasonsOverlay({ onClose }: { onClose: () => void }) {
  const read = useStore((s) => s.reasonsRead)
  const [cur, setCur] = useState<number | null>(null)
  const [k, setK] = useState(0)
  const [shake, setShake] = useState(false)
  const jarRef = useRef<HTMLButtonElement>(null)
  const total = REASONS.length

  const draw = () => {
    unlockAudio()
    if (shake) return
    let unread = REASONS.map((_, i) => i).filter((i) => !read.includes(i))
    let reset = false
    if (!unread.length) {
      unread = REASONS.map((_, i) => i)
      reset = true
    }
    const mine = PERSONAL.reasonsCount
    const next = mine && unread[0] < mine ? unread[0] : choice(unread)
    setShake(true)
    play('nom')
    haptic('light')
    setTimeout(() => {
      setShake(false)
      setCur(next)
      setK((x) => x + 1)
      play('chime')
      const [x, y] = centerOf(jarRef.current)
      burst(x, y - 60, { count: 10, kinds: ['heart', 'sparkle'], spread: 110 })
      const list = reset ? [next] : [...read, next]
      update((s) => ({ ...s, reasonsRead: list }))
      if (list.length >= 10) unlockSecret('reasons10')
    }, 520)
  }

  const all = read.length >= total
  return (
    <Overlay className="ritual reasons-ov" onClose={onClose}>
      <div className="ritual-inner">
        <h1>100 причин, чому я тебе кохаю</h1>
        <p className="sub">Торкнися баночки — і витягни записочку.</p>
        <button ref={jarRef} className={'jar-btn' + (shake ? ' shake' : '')} onClick={draw} aria-label="Витягти причину">
          <JarSvg className="jar-svg" />
        </button>
        {cur !== null && (
          <div className="reason-paper" key={k}>
            <p className="reason-no">Причина №{cur + 1}</p>
            <p className="reason-text">{REASONS[cur]}</p>
            <p className="sign">{SIGN}</p>
          </div>
        )}
        <Btn className="cta small" onClick={draw}>
          {cur === null ? 'Витягти причину 💌' : 'Ще одна причина 💌'}
        </Btn>
        <div className="progress" aria-label={`Прочитано ${read.length} із ${total}`}>
          <i style={{ width: Math.min(100, (read.length / total) * 100) + '%' }} />
        </div>
        <p className="hint">
          {all ? 'Ти прочитала всі причини. Але насправді їх нескінченно ❤️' : `Прочитано ${read.length} із ${total}`}
        </p>
      </div>
      <CloseBtn onClose={onClose} />
    </Overlay>
  )
}

// ---------- Мирилка ----------
export function PeaceOverlay({ onClose }: { onClose: () => void }) {
  // спершу — особисті вибачення Ігоря (якщо є), далі — усі по колу
  const [ai, setAi] = useState(() =>
    PERSONAL.apologyCount ? Math.floor(Math.random() * PERSONAL.apologyCount) : pick('apology', APOLOGIES.length),
  )
  const [ak, setAk] = useState(0)
  const signedAt = useStore((s) => s.treatySigned)
  const [stampK, setStampK] = useState(0)

  useEffect(() => {
    play('chime')
  }, [])

  const sign = () => {
    unlockAudio()
    play('tada')
    setTimeout(() => play('kisses'), 450)
    haptic('hug')
    update((s) => ({ ...s, treatySigned: Date.now() }))
    setStampK((x) => x + 1)
    rain(['heart', 'petal'], 30)
    unlockSecret('treaty')
  }

  const send = (text: string) => {
    unlockAudio()
    play('pop')
    haptic('light')
    shareText('МурLove', `${text}\n— Мар’яна 💌`, copied)
  }

  const signedDate = signedAt ? new Date(signedAt).toLocaleDateString('uk-UA', MONTH) : ''

  return (
    <Overlay className="ritual peace-ov" onClose={onClose}>
      <div className="ritual-inner">
        <div className="peace-hero">
          <div className="peace-pup">
            <Pet id="puppy" state="happy" />
            <FlagSvg className="peace-flag" />
          </div>
        </div>
        <h1>Мирилка 🕊️</h1>
        <p className="sub center">Для днів, коли щось пішло не так. Бо ми — одна команда.</p>

        <section className="card glass apology">
          <p className="kicker">Від Ігоря 💌</p>
          <p className="apology-text" key={ak}>
            {APOLOGIES[ai]}
          </p>
          <p className="sign">{SIGN}</p>
          <button
            className="text-btn"
            onClick={() => {
              setAi(pick('apology', APOLOGIES.length))
              setAk((x) => x + 1)
              play('chime')
            }}
          >
            Ще одне ↻
          </button>
        </section>

        <section className="treaty">
          <p className="kicker">Мирний договір</p>
          <h2>між Мар’яною та Ігорем</h2>
          <ol>
            {TREATY.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ol>
          <div className="signs">
            <div className="sign-box">
              <span className="sig ihor">Ігор ❤️</span>
              <span className="sig-cap">підписано</span>
            </div>
            <button className="sign-box mine" onClick={sign}>
              {signedAt ? (
                <>
                  <PawStamp className="stamp" key={stampK} />
                  <span className="sig-cap">Мар’яна · {signedDate}</span>
                </>
              ) : (
                <>
                  <span className="sig-empty">🐾 Підписати лапкою</span>
                  <span className="sig-cap">Мар’яна</span>
                </>
              )}
            </button>
          </div>
          {signedAt > 0 && (
            <Btn
              kind="soft"
              className="treaty-send"
              onClick={() => send('🕊️ Мирний договір підписано! Сваримося не довше, ніж холоне чай, а перед сном — обов’язкові обійми.')}
            >
              Надіслати Ігорю 💌
            </Btn>
          )}
        </section>

        <section className="signals">
          <h2>Скажи без слів</h2>
          <p className="sub">Надішли Ігорю одним дотиком — він зрозуміє.</p>
          <div className="signal-grid">
            {SIGNALS.map((s) => (
              <button key={s.label} className="signal" onClick={() => send(s.text)}>
                <span className="signal-emoji">{s.emoji}</span>
                <span>{s.label}</span>
              </button>
            ))}
          </div>
        </section>
      </div>
      <CloseBtn onClose={onClose} />
    </Overlay>
  )
}

// ---------- Засинай зі мною ----------
type WakeLockLike = { release: () => Promise<void> } | null

export function NightOverlay({ onClose }: { onClose: () => void }) {
  const [mins, setMins] = useState(20)
  const [left, setLeft] = useState(0)
  const [done, setDone] = useState(false)
  const [line, setLine] = useState(() => choice(NIGHT_LINES))
  const end = useRef(0)
  const lock = useRef<WakeLockLike>(null)
  const playing = left > 0

  const keepAwake = async (on: boolean) => {
    try {
      if (on) {
        const wl = (navigator as Navigator & { wakeLock?: { request: (t: 'screen') => Promise<WakeLockLike> } }).wakeLock
        lock.current = (await wl?.request('screen')) ?? null
      } else {
        await lock.current?.release()
        lock.current = null
      }
    } catch {
      /* без утримання екрана */
    }
  }

  const stop = (fade = 1.5) => {
    setNightMusic(false, fade)
    stopPurr(fade / 3)
    keepAwake(false)
    end.current = 0
    setLeft(0)
  }

  const start = (m = mins) => {
    unlockAudio()
    if (!getState().settings.sound) {
      setSetting('sound', true)
      toast('Звук увімкнено 🔊')
    }
    setNightMusic(true)
    if (!purrActive()) startPurr(0.4)
    haptic('light')
    setDone(false)
    end.current = Date.now() + m * 60000
    setLeft(m * 60)
    keepAwake(true)
    unlockSecret('night')
  }

  useEffect(() => {
    if (!playing) return
    const t = setInterval(() => {
      const s = Math.max(0, Math.round((end.current - Date.now()) / 1000))
      setLeft(s)
      if (s <= 0) {
        stop(10)
        setDone(true)
      }
    }, 1000)
    return () => clearInterval(t)
  }, [playing])

  useEffect(() => {
    const t = setInterval(() => setLine((l) => choice(NIGHT_LINES.filter((x) => x !== l))), 16000)
    const vis = () => {
      if (!document.hidden && end.current > Date.now()) {
        unlockAudio()
        if (!purrActive()) startPurr(0.4)
        keepAwake(true)
      }
    }
    document.addEventListener('visibilitychange', vis)
    return () => {
      clearInterval(t)
      document.removeEventListener('visibilitychange', vis)
      stop(1)
    }
  }, [])

  const mm = `${Math.floor(left / 60)}:${String(left % 60).padStart(2, '0')}`

  return (
    <Overlay className="ritual night-ov" onClose={onClose}>
      <div className="night-stars" aria-hidden="true">
        {Array.from({ length: 34 }, (_, i) => (
          <i key={i} style={{ left: ((i * 47) % 97) + '%', top: ((i * 31) % 70) + '%', animationDelay: (i % 9) * 0.5 + 's' }} />
        ))}
      </div>
      <div className="ritual-inner">
        <div className="night-art">
          <div className={'night-glow' + (playing ? ' on' : '')} />
          <div className="moon" />
          <div className="night-cloud" />
          <Pet id="panda" state="sleep" className="night-panda" />
        </div>
        <p className="night-line" key={line}>
          {done ? 'Солодких снів, сонечко. Я тебе кохаю ❤️' : line}
        </p>
        {playing && <p className="night-left">Колискова грає ще {mm}</p>}
        <div className="night-mins" role="radiogroup" aria-label="Скільки грати">
          {[10, 20, 30].map((m) => (
            <button
              key={m}
              role="radio"
              aria-checked={mins === m}
              className={mins === m ? 'on' : ''}
              onClick={() => {
                setMins(m)
                play('tap')
                if (playing) {
                  end.current = Date.now() + m * 60000
                  setLeft(m * 60)
                }
              }}
            >
              {m} хв
            </button>
          ))}
        </div>
        {playing ? (
          <Btn kind="soft" className="night-btn" onClick={() => stop(2)}>
            Зупинити
          </Btn>
        ) : (
          <Btn className="night-btn cta small" onClick={() => start()}>
            Увімкнути колискову 🌙
          </Btn>
        )}
        <p className="night-tip">
          Муркотіння й колискова поступово стихнуть самі. Екран не гасне, поки грає музика.
          <HeartSvg className="tiny-heart" />
        </p>
      </div>
      <CloseBtn onClose={onClose} light />
    </Overlay>
  )
}
