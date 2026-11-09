// Маленькі сцени для настрою «Як почувається моє сонечко?»
import { useEffect, useState } from 'react'
import { Pet, PET_IDS } from './pets'
import { HeartSvg, LipsSvg, FlagSvg } from './art'
import { MOODS, SIGNALS, type MoodId } from './content'
import { Overlay, Btn, shareText } from './ui'
import { play, purrFor } from './sound'
import { haptic } from './device'
import { rain, burst } from './fx'
import { pick, isCalm, toast } from './store'

export function MoodScene({ id, onClose, onPeace }: { id: MoodId; onClose: () => void; onPeace?: () => void }) {
  const m = MOODS.find((x) => x.id === id)!
  const [line] = useState(() => m.lines[pick('mood-' + id, m.lines.length)])
  const [phase, setPhase] = useState(0)
  const [breath, setBreath] = useState<'in' | 'out' | null>(null)

  useEffect(() => {
    const ts: number[] = []
    // exact=true — для дихання: темп не прискорюється навіть у режимі «Менше руху»
    const at = (ms: number, fn: () => void, exact = false) => ts.push(window.setTimeout(fn, isCalm() && !exact ? Math.min(ms, 300) : ms))
    const W = window.innerWidth
    const H = window.innerHeight
    if (id === 'happy') {
      play('tada')
      haptic('strong')
      at(350, () => play('yip'))
      at(700, () => play('squeak'))
      at(1000, () => play('boing'))
      rain(['heart', 'star', 'sparkle'], 44)
    } else if (id === 'tired') {
      play('bowl')
      at(600, () => purrFor(5, 0.7))
      let i = 0
      const step = () => {
        if (i >= 6) {
          setBreath(null)
          return
        }
        const ph = i % 2 === 0 ? 'in' : 'out'
        setBreath(ph)
        if (ph === 'in' && i > 0) play('chime')
        i++
        at(4000, step, true)
      }
      at(1200, step, true)
    } else if (id === 'sad') {
      play('whoosh')
      at(1300, () => {
        setPhase(1)
        play('yip')
        haptic('hug')
      })
      at(1900, () => {
        setPhase(2)
        play('chime')
        burst(W / 2, H * 0.42, { count: 18, kinds: ['heart', 'sparkle'], spread: 150 })
      })
    } else if (id === 'tender') {
      at(450, () => {
        setPhase(1)
        play('kisses')
        haptic('hug')
        burst(W / 2, H * 0.36, { count: 20, kinds: ['heart'], spread: 170 })
      })
      at(1700, () => play('kiss'))
      at(900, () => rain(['heart', 'petal'], 30))
    } else if (id === 'anxious') {
      play('bowl')
      at(500, () => purrFor(4, 0.5))
      let i = 0
      const step = () => {
        if (i >= 12) {
          setBreath(null)
          play('chime')
          return
        }
        const ph = i % 2 === 0 ? 'in' : 'out'
        setBreath(ph)
        if (ph === 'in') haptic('light')
        i++
        at(ph === 'in' ? 4000 : 6000, step, true)
      }
      at(1000, step, true)
    } else if (id === 'angry') {
      play('whoosh')
      at(1200, () => {
        setPhase(1)
        play('yip')
        haptic('medium')
      })
      at(2500, () => {
        setPhase(2)
        play('squeak')
        play('chime')
        burst(W / 2, H * 0.4, { count: 18, kinds: ['heart', 'sparkle'], spread: 150 })
      })
    }
    return () => ts.forEach(clearTimeout)
  }, [id])

  return (
    <Overlay className={'mood-scene scene-' + id} onClose={onClose}>
      <div className="scene-art">
        {id === 'happy' && (
          <div className="party">
            {PET_IDS.map((p, i) => (
              <div key={p} className="party-pet" style={{ animationDelay: i * 0.12 + 's' }}>
                <Pet id={p} state="happy" />
              </div>
            ))}
          </div>
        )}

        {id === 'tired' && (
          <div className="onsen">
            <div className="steam s1" />
            <div className="steam s2" />
            <div className="steam s3" />
            <Pet id="capy" state={breath === 'out' ? 'happy' : 'idle'} className="onsen-capy" />
            <div className="water" />
            {breath && (
              <div className={'breath big ' + breath}>
                <div className="breath-ring" />
                <span>{breath === 'in' ? 'Вдих…' : 'Видих…'}</span>
              </div>
            )}
          </div>
        )}

        {id === 'sad' && (
          <div className="sad-walk">
            <div className={'sad-puppy' + (phase >= 1 ? ' arrived' : '')}>
              <Pet id="puppy" state={phase >= 2 ? 'happy' : 'heart'} />
            </div>
            {phase >= 2 && <HeartSvg className="dropped-heart" />}
          </div>
        )}

        {id === 'anxious' && (
          <div className="calm-art">
            <Pet id="panda" state={breath === 'out' ? 'sleep' : 'happy'} className="calm-panda" />
            {breath && (
              <div className={'breath big ' + breath}>
                <div className="breath-ring" style={{ animationDuration: breath === 'in' ? '4s' : '6s' }} />
                <span>{breath === 'in' ? 'Вдих… 4 секунди' : 'Видих… 6 секунд'}</span>
              </div>
            )}
          </div>
        )}

        {id === 'angry' && (
          <div className="truce">
            <div className="truce-ham">
              <Pet id="hamster" state={phase >= 2 ? 'happy' : 'idle'} cheeks={phase >= 2 ? 0 : 5} />
            </div>
            <div className={'truce-pup' + (phase >= 1 ? ' arrived' : '')}>
              <Pet id="puppy" state="happy" />
              <FlagSvg className="truce-flag" />
            </div>
          </div>
        )}

        {id === 'tender' && (
          <div className="kiss-art">
            <Pet id="kitty" state="shy" className="kiss-kitty" />
            {phase >= 1 && <LipsSvg className="big-lips" />}
            {phase >= 1 && (
              <>
                <LipsSvg className="mini-lips a" />
                <LipsSvg className="mini-lips b" />
                <LipsSvg className="mini-lips c" />
              </>
            )}
          </div>
        )}
      </div>

      <div className="scene-card glass">
        <h2>
          {m.title} {m.emoji}
        </h2>
        <p>{line}</p>
        {id === 'anxious' && <p className="scene-note">Якщо зараз повітряна тривога — спершу в безпечне місце. Подихати можна й там 🧡</p>}
        <Btn className="cta small" onClick={onClose}>
          Дякую, Ігорю ❤️
        </Btn>
        {id === 'angry' && (
          <div className="scene-more">
            <Btn
              kind="soft"
              onClick={() => shareText('МурLove', `${SIGNALS[2].text}\n— Мар’яна 💌`, () => toast('Текст скопійовано — надішли його Ігорю 💌'))}
            >
              Сказати Ігорю: «Поговоримо?»
            </Btn>
            {onPeace && (
              <Btn kind="ghost" onClick={onPeace}>
                Відкрити Мирилку 🕊️
              </Btn>
            )}
          </div>
        )}
      </div>
    </Overlay>
  )
}
