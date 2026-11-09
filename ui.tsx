// Спільні елементи інтерфейсу: аркуші, тости, перемикачі, жести, панель вкладок.
import { useEffect, useRef, useState, type ReactNode, type PointerEvent as RPointerEvent, type MouseEvent as RMouseEvent } from 'react'
import { createPortal } from 'react-dom'
import { Icon } from './art'
import { onToast, type ToastMsg } from './store'
import { play, unlockAudio } from './sound'
import { haptic } from './device'

export function Portal({ to = 'overlays', children }: { to?: string; children: ReactNode }) {
  const el = document.getElementById(to)
  return el ? createPortal(children, el) : <>{children}</>
}

/** Нижній аркуш у стилі iOS. */
export function Sheet({
  open,
  onClose,
  title,
  children,
  tall,
  className,
}: {
  open: boolean
  onClose: () => void
  title?: ReactNode
  children: ReactNode
  tall?: boolean
  className?: string
}) {
  const [shown, setShown] = useState(open)
  const [leaving, setLeaving] = useState(false)
  useEffect(() => {
    if (open) {
      setShown(true)
      setLeaving(false)
    } else if (shown) {
      setLeaving(true)
      const t = setTimeout(() => {
        setShown(false)
        setLeaving(false)
      }, 260)
      return () => clearTimeout(t)
    }
  }, [open])
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])
  if (!shown) return null
  return (
    <Portal>
      <div className={'sheet-wrap' + (leaving ? ' leaving' : '')} role="dialog" aria-modal="true">
        <div className="sheet-backdrop" onClick={onClose} />
        <div className={'sheet' + (tall ? ' tall' : '') + (className ? ' ' + className : '')}>
          <div className="sheet-grab" />
          <div className="sheet-head">
            <div className="sheet-title">{title}</div>
            <button className="icon-btn" onClick={onClose} aria-label="Закрити">
              <Icon name="close" />
            </button>
          </div>
          <div className="sheet-body">{children}</div>
        </div>
      </div>
    </Portal>
  )
}

/** Повноекранний шар (сцени, перегляд фото, освідчення). */
export function Overlay({ children, onClose, className }: { children: ReactNode; onClose?: () => void; className?: string }) {
  useEffect(() => {
    if (!onClose) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])
  return (
    <Portal>
      <div className={'overlay ' + (className || '')} role="dialog" aria-modal="true">
        {children}
      </div>
    </Portal>
  )
}

export function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label className="toggle">
      <span className="toggle-label">{label}</span>
      <input
        type="checkbox"
        role="switch"
        checked={checked}
        onChange={(e) => {
          onChange(e.target.checked)
          play('tap')
        }}
      />
      <span className="toggle-ui" aria-hidden="true" />
    </label>
  )
}

export function Toasts() {
  const [list, setList] = useState<ToastMsg[]>([])
  useEffect(
    () =>
      onToast((t) => {
        setList((l) => [...l.slice(-2), t])
        setTimeout(() => setList((l) => l.filter((x) => x.id !== t.id)), 3200)
      }),
    [],
  )
  return (
    <Portal to="toasts">
      <div className="toasts" aria-live="polite">
        {list.map((t) => (
          <div key={t.id} className="toast">
            {t.icon && <span className="toast-icon">{t.icon}</span>}
            <span>{t.text}</span>
          </div>
        ))}
      </div>
    </Portal>
  )
}

// ---------- Жести: дотик, погладжування, утримання ----------
export interface GestureHandlers {
  onTap?: (x: number, y: number) => void
  onStroke?: (x: number, y: number, total: number) => void
  onStrokeEnd?: (total: number) => void
  onHold?: (x: number, y: number) => void
  holdMs?: number
}

export function useGestures(h: GestureHandlers) {
  const ref = useRef(h)
  ref.current = h
  const g = useRef({ down: false, x: 0, y: 0, lx: 0, ly: 0, t: 0, total: 0, stroking: false, held: false, timer: 0, last: 0 })

  const end = (cancel: boolean) => {
    const s = g.current
    if (!s.down) return
    s.down = false
    clearTimeout(s.timer)
    if (s.stroking) ref.current.onStrokeEnd?.(s.total)
    else if (!cancel && !s.held && performance.now() - s.t < 600) ref.current.onTap?.(s.x, s.y)
  }

  return {
    onPointerDown(e: RPointerEvent<HTMLElement>) {
      unlockAudio()
      const s = g.current
      try {
        e.currentTarget.setPointerCapture(e.pointerId)
      } catch {
        /* ігноруємо */
      }
      Object.assign(s, { down: true, x: e.clientX, y: e.clientY, lx: e.clientX, ly: e.clientY, t: performance.now(), total: 0, stroking: false, held: false })
      clearTimeout(s.timer)
      s.timer = window.setTimeout(() => {
        if (s.down && !s.stroking) {
          s.held = true
          ref.current.onHold?.(s.x, s.y)
        }
      }, ref.current.holdMs ?? 650)
    },
    onPointerMove(e: RPointerEvent<HTMLElement>) {
      const s = g.current
      if (!s.down) return
      const d = Math.hypot(e.clientX - s.lx, e.clientY - s.ly)
      s.lx = e.clientX
      s.ly = e.clientY
      s.total += d
      if (!s.stroking && !s.held && s.total > 16) {
        s.stroking = true
        clearTimeout(s.timer)
      }
      const now = performance.now()
      if (s.stroking && now - s.last > 70) {
        s.last = now
        ref.current.onStroke?.(e.clientX, e.clientY, s.total)
      }
    },
    onPointerUp() {
      end(false)
    },
    onPointerCancel() {
      end(true)
    },
    onLostPointerCapture() {
      end(true)
    },
    onContextMenu(e: RMouseEvent) {
      e.preventDefault()
    },
  }
}

// ---------- Кнопка з відгуком ----------
export function Btn({
  children,
  onClick,
  kind = 'primary',
  className,
  disabled,
  ariaLabel,
}: {
  children: ReactNode
  onClick?: (e: RMouseEvent<HTMLButtonElement>) => void
  kind?: 'primary' | 'soft' | 'ghost'
  className?: string
  disabled?: boolean
  ariaLabel?: string
}) {
  return (
    <button
      className={`btn btn-${kind}${className ? ' ' + className : ''}`}
      disabled={disabled}
      aria-label={ariaLabel}
      onClick={(e) => {
        unlockAudio()
        haptic('light')
        onClick?.(e)
      }}
    >
      {children}
    </button>
  )
}

// ---------- Панель вкладок ----------
export type Tab = 'home' | 'pets' | 'laugh' | 'hug' | 'gifts' | 'love'

const TABS: { id: Tab; label: string; icon: Parameters<typeof Icon>[0]['name'] }[] = [
  { id: 'home', label: 'Дім', icon: 'home' },
  { id: 'pets', label: 'Пухнасті', icon: 'paw' },
  { id: 'laugh', label: 'Сміх', icon: 'laugh' },
  { id: 'hug', label: 'Обійми', icon: 'hug' },
  { id: 'gifts', label: 'Сюрпризи', icon: 'gift' },
  { id: 'love', label: 'Ми', icon: 'love' },
]

export function TabBar({ tab, onChange }: { tab: Tab; onChange: (t: Tab) => void }) {
  return (
    <nav className="tabbar" aria-label="Розділи">
      {TABS.map((t) => (
        <button
          key={t.id}
          className={'tab' + (t.id === tab ? ' active' : '')}
          aria-current={t.id === tab ? 'page' : undefined}
          onClick={() => {
            unlockAudio()
            if (t.id !== tab) {
              play('tap')
              haptic('light')
              onChange(t.id)
            }
          }}
        >
          <Icon name={t.icon} />
          <span>{t.label}</span>
        </button>
      ))}
    </nav>
  )
}

/** Поділитися текстом (системне меню «Поділитися» або копіювання). */
export async function shareText(title: string, text: string, onCopied: () => void) {
  const nav = navigator as Navigator & { share?: (d: ShareData) => Promise<void> }
  if (typeof nav.share === 'function') {
    try {
      await nav.share({ title, text })
      return
    } catch (e) {
      if ((e as DOMException)?.name === 'AbortError') return
    }
  }
  try {
    await navigator.clipboard.writeText(text)
    onCopied()
  } catch {
    onCopied()
  }
}

export function fmtDate(ts: number) {
  try {
    return new Date(ts).toLocaleString('uk-UA', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })
  } catch {
    return new Date(ts).toLocaleString()
  }
}
