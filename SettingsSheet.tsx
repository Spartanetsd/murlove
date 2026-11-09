// Налаштування: звук, гучність, музика, вібрація, менше руху, трусіння, наша дата, секрети.
import { Sheet, Toggle } from './ui'
import { SECRETS } from './content'
import { setSetting, useStore, toast, type MotionPref } from './store'
import { play, unlockAudio } from './sound'
import { haptic, isIOS, isStandalone, requestShakePermission, shakeSupported } from './device'

export function SettingsSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const s = useStore((x) => x.settings)
  const secrets = useStore((x) => x.secrets)

  return (
    <Sheet open={open} onClose={onClose} title="Налаштування" tall>
      <div className="set-group glass">
        <Toggle
          label="🔊 Звук"
          checked={s.sound}
          onChange={(v) => {
            unlockAudio()
            setSetting('sound', v)
            if (v) setTimeout(() => play('chime'), 80)
          }}
        />
        <label className="slider">
          <span>Гучність</span>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={s.volume}
            disabled={!s.sound}
            onChange={(e) => setSetting('volume', +e.target.value)}
            onPointerUp={() => play('chime')}
          />
        </label>
        <Toggle
          label="🎵 Фонова колискова"
          checked={s.music}
          onChange={(v) => {
            unlockAudio()
            setSetting('music', v)
            if (v && !s.sound) setSetting('sound', true)
          }}
        />
        <label className="slider">
          <span>Гучність музики</span>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={s.musicVolume}
            disabled={!s.music}
            onChange={(e) => setSetting('musicVolume', +e.target.value)}
          />
        </label>
        {isIOS() && (
          <Toggle
            label="🔕 Грати навіть у беззвучному режимі"
            checked={s.ignoreSilent}
            onChange={(v) => setSetting('ignoreSilent', v)}
          />
        )}
      </div>

      <div className="set-group glass">
        <Toggle
          label="📳 Тактильний відгук"
          checked={s.haptics}
          onChange={(v) => {
            setSetting('haptics', v)
            if (v) setTimeout(() => haptic('medium'), 30)
          }}
        />
        <div className="segmented-row">
          <span>🌙 Анімації</span>
          <div className="segmented" role="radiogroup" aria-label="Анімації">
            {(
              [
                ['auto', 'Як у системі'],
                ['full', 'Усі'],
                ['calm', 'Менше руху'],
              ] as [MotionPref, string][]
            ).map(([v, l]) => (
              <button
                key={v}
                role="radio"
                aria-checked={s.motion === v}
                className={s.motion === v ? 'on' : ''}
                onClick={() => {
                  setSetting('motion', v)
                  play('tap')
                }}
              >
                {l}
              </button>
            ))}
          </div>
        </div>
        {shakeSupported() && (
          <Toggle
            label="💞 Потрусити телефон — посиплються сердечка"
            checked={s.shake}
            onChange={async (v) => {
              if (!v) {
                setSetting('shake', false)
                return
              }
              const r = await requestShakePermission()
              if (r === 'granted') {
                setSetting('shake', true)
                toast('Тепер потруси телефоном 💞')
              } else {
                setSetting('shake', false)
                toast('Без дозволу на рух трусіння не працюватиме', '📱')
              }
            }}
          />
        )}
      </div>

      <div className="set-group glass">
        <label className="date-row">
          <span>💑 Наша особлива дата</span>
          <input type="date" value={s.ourDate} max={new Date().toISOString().slice(0, 10)} onChange={(e) => setSetting('ourDate', e.target.value)} />
        </label>
        <p className="muted small">Якщо вказати, на сторінці «Ми» з’явиться лічильник днів разом.</p>
      </div>

      <div className="set-group glass">
        <h3 className="set-h">
          ✨ Маленькі секрети: {secrets.length} з {SECRETS.length}
        </h3>
        <ul className="secret-list">
          {SECRETS.map((x) => {
            const ok = secrets.includes(x.id)
            return (
              <li key={x.id} className={ok ? 'ok' : ''}>
                <span className="secret-ico">{ok ? '💖' : '🔒'}</span>
                <div>
                  <b>{ok ? x.title : 'Секрет'}</b>
                  <span>{x.hint}</span>
                </div>
              </li>
            )
          })}
        </ul>
      </div>

      {!isStandalone() && (
        <div className="set-group glass">
          <h3 className="set-h">📲 Встановити на головний екран</h3>
          <p className="muted small">
            {isIOS()
              ? 'Відкрий цю сторінку в Safari → кнопка «Поділитися» → «На початковий екран». Після першого запуску застосунок працює й без інтернету.'
              : 'Меню браузера → «Встановити застосунок» або «Додати на головний екран».'}
          </p>
        </div>
      )}

      <div className="about">
        <p>
          <b>МурLove</b> — зроблено з любов’ю Ігорем для Мар’яни.
        </p>
        <p className="muted small">Без реклами, без акаунтів і без стеження. Фото, голосові й налаштування зберігаються лише на цьому пристрої.</p>
      </div>
    </Sheet>
  )
}
