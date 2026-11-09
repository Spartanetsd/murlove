// «Наша любов»: велике серце, галерея спогадів, голосові послання. Усе — лише на цьому пристрої.
import { useEffect, useRef, useState, type ChangeEvent } from 'react'
import { HeartSvg, Icon } from './art'
import { Pet } from './pets'
import { PERSONAL } from './content'
import { Btn, Overlay, Sheet, fmtDate } from './ui'
import { play, unlockAudio, duckMusic } from './sound'
import { haptic, askPersistentStorage } from './device'
import { listPhotos, addPhoto, deletePhoto, listVoices, addVoice, deleteVoice, type Photo, type Voice } from './db'
import { toast, useStore } from './store'

export function LoveScreen({ heartTap }: { heartTap: (el: Element | null) => void }) {
  const heartRef = useRef<HTMLButtonElement>(null)
  const [beat, setBeat] = useState(0)
  const ourDate = useStore((s) => s.settings.ourDate) || PERSONAL.ourDate
  const days = ourDate ? Math.floor((Date.now() - new Date(ourDate + 'T00:00:00').getTime()) / 86400000) : -1

  return (
    <div className="love">
      <div className="love-hero">
        <div className="orbit-clip" aria-hidden="true">
          <div className="orbit">
            {Array.from({ length: 8 }, (_, i) => (
              <i key={i} style={{ ['--i' as string]: i }} />
            ))}
          </div>
        </div>
        <div className="hero-pet l">
          <Pet id="kitty" state="happy" />
        </div>
        <div className="hero-pet r">
          <Pet id="puppy" state="happy" />
        </div>
        <button
          ref={heartRef}
          className={'love-heart' + (beat ? ' tapped' : '')}
          key={beat}
          aria-label="Ігор і Мар’яна"
          onClick={() => {
            setBeat((b) => b + 1)
            heartTap(heartRef.current)
          }}
        >
          <HeartSvg />
          <span className="love-names">
            Ігор <em>❤️</em> Мар’яна
          </span>
        </button>
      </div>
      {days >= 0 && (
        <p className="together">
          Разом уже <b>{days.toLocaleString('uk-UA')}</b> {plural(days, 'день', 'дні', 'днів')} ❤️
        </p>
      )}

      <Gallery />
      <Voices />

      <p className="privacy">🔒 Фото й голосові зберігаються лише на цьому телефоні. Нічого не надсилається в інтернет.</p>
    </div>
  )
}

function plural(n: number, one: string, few: string, many: string) {
  const a = n % 10
  const b = n % 100
  if (a === 1 && b !== 11) return one
  if (a >= 2 && a <= 4 && (b < 12 || b > 14)) return few
  return many
}

// ---------- Галерея ----------
function Gallery() {
  const [photos, setPhotos] = useState<Photo[]>([])
  const [urls, setUrls] = useState<Record<string, string>>({})
  const [view, setView] = useState<number | null>(null)
  const [busy, setBusy] = useState(false)
  const [ask, setAsk] = useState<string | null>(null)

  const refresh = async () => {
    try {
      const list = await listPhotos()
      setPhotos(list)
      setUrls((old) => {
        const next: Record<string, string> = {}
        for (const p of list) next[p.id] = old[p.id] || URL.createObjectURL(p.blob)
        for (const id in old) if (!next[id]) URL.revokeObjectURL(old[id])
        return next
      })
    } catch {
      toast('Не вдалося відкрити галерею на цьому пристрої', '⚠️')
    }
  }
  useEffect(() => {
    refresh()
    return () => setUrls((old) => (Object.values(old).forEach((u) => URL.revokeObjectURL(u)), {}))
  }, [])

  const onFiles = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    e.target.value = ''
    if (!files.length) return
    setBusy(true)
    askPersistentStorage()
    let ok = 0
    for (const f of files) {
      try {
        await addPhoto(f)
        ok++
      } catch {
        /* пропускаємо файл */
      }
    }
    setBusy(false)
    await refresh()
    if (ok) {
      play('sparkle')
      toast(ok === 1 ? 'Спогад збережено 📸' : `Збережено спогадів: ${ok} 📸`)
    } else toast('Не вдалося зберегти фото', '⚠️')
  }

  const remove = async (id: string) => {
    await deletePhoto(id).catch(() => {})
    setAsk(null)
    setView(null)
    play('pop')
    refresh()
  }

  return (
    <section className="block">
      <div className="block-head">
        <h2>Наші спогади 📸</h2>
        <label className={'btn btn-soft small' + (busy ? ' busy' : '')} onClick={() => unlockAudio()}>
          <input type="file" accept="image/*" multiple hidden onChange={onFiles} />
          <Icon name="plus" /> Додати фото
        </label>
      </div>
      {photos.length === 0 ? (
        <div className="empty glass">
          <span className="empty-emoji">🖼️</span>
          <p>Тут житимуть наші найтепліші миті. Додай перше фото — воно залишиться тільки на цьому телефоні.</p>
        </div>
      ) : (
        <div className="photo-grid">
          {photos.map((p, i) => (
            <button key={p.id} className="polaroid" style={{ ['--r' as string]: ((i * 37) % 7) - 3 + 'deg' }} onClick={() => setView(i)}>
              <img src={urls[p.id]} alt="" decoding="async" />
            </button>
          ))}
        </div>
      )}

      {view !== null && photos[view] && (
        <PhotoViewer
          photos={photos}
          urls={urls}
          index={view}
          setIndex={setView}
          onClose={() => setView(null)}
          onDelete={(id) => setAsk(id)}
        />
      )}

      <Sheet open={!!ask} onClose={() => setAsk(null)} title="Видалити це фото?">
        <p className="muted">Фото зникне з галереї на цьому телефоні.</p>
        <div className="sheet-actions">
          <Btn kind="soft" onClick={() => setAsk(null)}>
            Залишити
          </Btn>
          <Btn className="danger" onClick={() => ask && remove(ask)}>
            Видалити
          </Btn>
        </div>
      </Sheet>
    </section>
  )
}

function PhotoViewer({
  photos,
  urls,
  index,
  setIndex,
  onClose,
  onDelete,
}: {
  photos: Photo[]
  urls: Record<string, string>
  index: number
  setIndex: (i: number) => void
  onClose: () => void
  onDelete: (id: string) => void
}) {
  const start = useRef<number | null>(null)
  const go = (d: number) => setIndex((index + d + photos.length) % photos.length)
  const p = photos[index]
  return (
    <Overlay className="viewer" onClose={onClose}>
      <div
        className="viewer-img"
        onPointerDown={(e) => (start.current = e.clientX)}
        onPointerUp={(e) => {
          if (start.current === null) return
          const dx = e.clientX - start.current
          start.current = null
          if (Math.abs(dx) > 50 && photos.length > 1) go(dx < 0 ? 1 : -1)
        }}
      >
        <img src={urls[p.id]} alt="Наш спогад" />
      </div>
      <div className="viewer-bar">
        <button className="icon-btn light" onClick={() => onDelete(p.id)} aria-label="Видалити фото">
          <Icon name="trash" />
        </button>
        <span>
          {index + 1} / {photos.length}
        </span>
        <div className="viewer-nav">
          {photos.length > 1 && (
            <>
              <button className="icon-btn light" onClick={() => go(-1)} aria-label="Попереднє фото">
                <Icon name="left" />
              </button>
              <button className="icon-btn light" onClick={() => go(1)} aria-label="Наступне фото">
                <Icon name="right" />
              </button>
            </>
          )}
          <button className="icon-btn light" onClick={onClose} aria-label="Закрити">
            <Icon name="close" />
          </button>
        </div>
      </div>
    </Overlay>
  )
}

// ---------- Голосові послання ----------
const MAX_SEC = 120

function Voices() {
  const [voices, setVoices] = useState<Voice[]>([])
  const [rec, setRec] = useState(false)
  const [secs, setSecs] = useState(0)
  const [level, setLevel] = useState<number[]>(Array(18).fill(0.1))
  const [playing, setPlaying] = useState<string | null>(null)
  const [ask, setAsk] = useState<string | null>(null)
  const mr = useRef<MediaRecorder | null>(null)
  const audio = useRef<HTMLAudioElement | null>(null)
  const audioUrl = useRef<string | null>(null)
  const cleanup = useRef<() => void>(() => {})

  const refresh = () =>
    listVoices()
      .then(setVoices)
      .catch(() => toast('Не вдалося відкрити голосові на цьому пристрої', '⚠️'))

  useEffect(() => {
    refresh()
    return () => {
      cleanup.current()
      stopPlay()
    }
  }, [])

  const stopPlay = () => {
    if (audio.current) {
      audio.current.pause()
      audio.current = null
    }
    if (audioUrl.current) URL.revokeObjectURL(audioUrl.current)
    audioUrl.current = null
    setPlaying(null)
    duckMusic(false)
  }

  const togglePlay = (v: Voice) => {
    unlockAudio()
    if (playing === v.id) {
      stopPlay()
      return
    }
    stopPlay()
    const url = URL.createObjectURL(v.blob)
    const a = new Audio(url)
    a.setAttribute('playsinline', '')
    audio.current = a
    audioUrl.current = url
    a.onended = () => stopPlay()
    a.onerror = () => {
      stopPlay()
      toast('Цей запис не відтворюється на цьому пристрої', '⚠️')
    }
    duckMusic(true)
    setPlaying(v.id)
    a.play().catch(() => {
      stopPlay()
      toast('Не вдалося відтворити запис', '⚠️')
    })
  }

  const startRec = async () => {
    unlockAudio()
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
      toast('Запис голосу не підтримується в цьому браузері. Можна додати готовий аудіофайл.', '🎙️')
      return
    }
    stopPlay()
    let stream: MediaStream
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } })
    } catch {
      toast('Потрібен дозвіл на мікрофон: Параметри → Safari → Мікрофон', '🎙️')
      return
    }
    const types = ['audio/mp4', 'audio/webm;codecs=opus', 'audio/webm', 'audio/aac']
    const mime = types.find((t) => MediaRecorder.isTypeSupported?.(t)) || ''
    let r: MediaRecorder
    try {
      r = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined)
    } catch {
      stream.getTracks().forEach((t) => t.stop())
      toast('Не вдалося почати запис', '⚠️')
      return
    }
    const chunks: Blob[] = []
    const t0 = Date.now()
    r.ondataavailable = (e) => e.data.size && chunks.push(e.data)
    r.onstop = async () => {
      cleanup.current()
      const type = r.mimeType || mime || 'audio/mp4'
      const blob = new Blob(chunks, { type })
      const dur = (Date.now() - t0) / 1000
      setRec(false)
      if (blob.size < 800 || dur < 0.8) {
        toast('Запис вийшов закоротким — спробуй ще раз', '🎙️')
        return
      }
      askPersistentStorage()
      try {
        await addVoice(blob, type, dur, 'Голосове послання')
        play('chime')
        toast('Голосове збережено 💌')
        refresh()
      } catch {
        toast('Не вдалося зберегти запис', '⚠️')
      }
    }

    // індикатор гучності
    let raf = 0
    let ac: AudioContext | null = null
    try {
      ac = new AudioContext()
      const src = ac.createMediaStreamSource(stream)
      const an = ac.createAnalyser()
      an.fftSize = 64
      src.connect(an)
      const data = new Uint8Array(an.frequencyBinCount)
      const loop = () => {
        an.getByteFrequencyData(data)
        const bars = Array.from({ length: 18 }, (_, i) => Math.max(0.08, data[i + 1] / 255))
        setLevel(bars)
        setSecs(Math.floor((Date.now() - t0) / 1000))
        raf = requestAnimationFrame(loop)
      }
      loop()
    } catch {
      /* без індикатора */
    }
    const limit = window.setTimeout(() => r.state === 'recording' && r.stop(), MAX_SEC * 1000)
    const tick = window.setInterval(() => setSecs(Math.floor((Date.now() - t0) / 1000)), 500)
    cleanup.current = () => {
      cancelAnimationFrame(raf)
      clearTimeout(limit)
      clearInterval(tick)
      stream.getTracks().forEach((t) => t.stop())
      ac?.close().catch(() => {})
      cleanup.current = () => {}
    }
    mr.current = r
    r.start(250)
    setSecs(0)
    setRec(true)
    haptic('medium')
  }

  const stopRec = () => {
    if (mr.current && mr.current.state === 'recording') mr.current.stop()
    haptic('light')
  }

  const onFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    e.target.value = ''
    if (!f) return
    const dur = await new Promise<number>((res) => {
      const url = URL.createObjectURL(f)
      const a = new Audio()
      a.preload = 'metadata'
      a.onloadedmetadata = () => {
        res(isFinite(a.duration) ? a.duration : 0)
        URL.revokeObjectURL(url)
      }
      a.onerror = () => {
        res(0)
        URL.revokeObjectURL(url)
      }
      a.src = url
    })
    try {
      askPersistentStorage()
      await addVoice(f, f.type || 'audio/mp4', dur, f.name.replace(/\.[^.]+$/, '') || 'Голосове послання')
      play('chime')
      toast('Аудіо збережено 💌')
      refresh()
    } catch {
      toast('Не вдалося зберегти аудіо', '⚠️')
    }
  }

  const fmt = (s: number) => (s > 0 ? `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}` : '—')

  return (
    <section className="block">
      <div className="block-head">
        <h2>Голосові послання 🎙️</h2>
        <label className="btn btn-ghost small" onClick={() => unlockAudio()}>
          <input type="file" accept="audio/*" hidden onChange={onFile} />
          <Icon name="upload" /> Файл
        </label>
      </div>

      <div className={'recorder glass' + (rec ? ' on' : '')}>
        {rec ? (
          <>
            <div className="meter" aria-hidden="true">
              {level.map((v, i) => (
                <i key={i} style={{ transform: `scaleY(${v})` }} />
              ))}
            </div>
            <div className="rec-row">
              <span className="rec-dot" /> Запис… {fmt(secs)} / 2:00
              <button className="rec-btn stop" onClick={stopRec} aria-label="Зупинити запис">
                <Icon name="stop" />
              </button>
            </div>
          </>
        ) : (
          <div className="rec-row">
            <p>Запиши ніжне послання — його можна буде слухати тут будь-коли.</p>
            <button className="rec-btn" onClick={startRec} aria-label="Почати запис">
              <Icon name="mic" />
            </button>
          </div>
        )}
      </div>

      {voices.length > 0 && (
        <ul className="voice-list">
          {voices.map((v) => (
            <li key={v.id} className={'voice glass' + (playing === v.id ? ' playing' : '')}>
              <button className="play-btn" onClick={() => togglePlay(v)} aria-label={playing === v.id ? 'Пауза' : 'Слухати'}>
                <Icon name={playing === v.id ? 'pause' : 'play'} />
              </button>
              <div className="voice-meta">
                <b>{v.title}</b>
                <span>
                  {fmtDate(v.created)} · {fmt(v.duration)}
                </span>
              </div>
              <button className="icon-btn" onClick={() => setAsk(v.id)} aria-label="Видалити запис">
                <Icon name="trash" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <Sheet open={!!ask} onClose={() => setAsk(null)} title="Видалити голосове?">
        <p className="muted">Запис зникне з цього телефона.</p>
        <div className="sheet-actions">
          <Btn kind="soft" onClick={() => setAsk(null)}>
            Залишити
          </Btn>
          <Btn
            className="danger"
            onClick={async () => {
              if (!ask) return
              if (playing === ask) stopPlay()
              await deleteVoice(ask).catch(() => {})
              setAsk(null)
              play('pop')
              refresh()
            }}
          >
            Видалити
          </Btn>
        </div>
      </Sheet>
    </section>
  )
}
