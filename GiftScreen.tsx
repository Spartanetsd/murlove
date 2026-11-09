// «Любовні сюрпризи» — коробочка, з якої щоразу виходить щось нове.
import { useRef, useState } from 'react'
import { GiftSvg, HeartSvg, FlowerSvg, LipsSvg, type FlowerDef } from './art'
import { Pet, type PetId, type PetState } from './pets'
import {
  GIFT_KINDS,
  GIFT_TITLES,
  LOVE,
  POSTCARDS,
  FLUFFY,
  ROMANTIC_JOKES,
  FLOWERS,
  KISSES,
  CERTS,
  COUPON_TITLE,
  PETS,
  SIGN,
  type GiftKind,
  type Postcard,
  type Anim,
} from './content'
import { Sheet, Btn, shareText } from './ui'
import { play, unlockAudio, type SoundName } from './sound'
import { haptic } from './device'
import { burst, centerOf } from './fx'
import { bump, pick, toast, unlockSecret, useStore, isCalm } from './store'

type Gift =
  | { kind: 'love'; text: string }
  | { kind: 'postcard'; card: Postcard }
  | { kind: 'fluffy'; pet: PetId; anim: Anim; state: PetState; text: string }
  | { kind: 'joke'; text: string }
  | { kind: 'flower'; flower: FlowerDef }
  | { kind: 'kiss'; text: string }
  | { kind: 'certificate'; title: string; no: string }
  | { kind: 'coupon'; no: string }

const num = () => String(1000 + Math.floor(Math.random() * 9000))

function makeGift(): Gift {
  const kind: GiftKind = GIFT_KINDS[pick('gift-kind', GIFT_KINDS.length)]
  switch (kind) {
    case 'love':
      return { kind, text: LOVE[pick('love', LOVE.length)] }
    case 'postcard':
      return { kind, card: POSTCARDS[pick('postcard', POSTCARDS.length)] }
    case 'fluffy':
      return { kind, ...FLUFFY[pick('fluffy', FLUFFY.length)] }
    case 'joke':
      return { kind, text: ROMANTIC_JOKES[pick('rjoke', ROMANTIC_JOKES.length)] }
    case 'flower':
      return { kind, flower: FLOWERS[pick('flower', FLOWERS.length)] }
    case 'kiss':
      return { kind, text: KISSES[pick('kiss', KISSES.length)] }
    case 'certificate':
      return { kind, title: CERTS[pick('cert', CERTS.length)], no: num() }
    case 'coupon':
      return { kind, no: num() }
  }
}

const SOUND: Record<GiftKind, SoundName> = {
  love: 'chime',
  postcard: 'sparkle',
  fluffy: 'boing',
  joke: 'giggle',
  flower: 'sparkle',
  kiss: 'kisses',
  certificate: 'tada',
  coupon: 'tada',
}

export function GiftScreen() {
  const [stage, setStage] = useState<'idle' | 'shake' | 'open'>('idle')
  const [gift, setGift] = useState<Gift | null>(null)
  const [k, setK] = useState(0)
  const opened = useStore((s) => s.stats.gifts)
  const boxRef = useRef<HTMLButtonElement>(null)

  const open = () => {
    unlockAudio()
    if (stage !== 'idle') return
    setStage('shake')
    play('gift')
    haptic('medium')
    const calm = isCalm()
    setTimeout(
      () => {
        setStage('open')
        haptic('strong')
        const [x, y] = centerOf(boxRef.current)
        burst(x, y - 40, { count: 26, kinds: ['heart', 'star', 'sparkle'], spread: 190, rise: 120 })
        const g = makeGift()
        const n = bump('gifts')
        if (n >= 10) unlockSecret('gifts10')
        setTimeout(
          () => {
            setGift(g)
            setK((x) => x + 1)
            const s = g.kind === 'fluffy' ? PETS[g.pet].sounds.tap : SOUND[g.kind]
            play(s)
          },
          calm ? 100 : 450,
        )
      },
      calm ? 150 : 700,
    )
  }

  const close = () => {
    setGift(null)
    setTimeout(() => setStage('idle'), 250)
  }

  const again = () => {
    setGift(null)
    setStage('idle')
    setTimeout(() => {
      setStage('idle')
      boxRef.current?.click()
    }, 320)
  }

  return (
    <div className="gifts">
      <h1 className="title">Любовні сюрпризи 🎁</h1>
      <p className="sub">Торкнися коробочки. Сюрпризів багато, і їх можна відкривати скільки завгодно.</p>
      <button ref={boxRef} className={'gift-btn ' + stage} onClick={open} aria-label="Відкрити сюрприз">
        <GiftSvg open={stage === 'open'} className="gift-svg" />
      </button>
      <p className="hint">{opened > 0 ? `Відкрито сюрпризів: ${opened}` : 'Усередині — щось дуже ніжне'}</p>

      <Sheet open={!!gift} onClose={close} title={gift ? GIFT_TITLES[gift.kind] : ''} className="gift-sheet">
        {gift && <GiftCard gift={gift} k={k} />}
        <div className="sheet-actions">
          <Btn onClick={again}>Ще сюрприз ✨</Btn>
          {gift && (gift.kind === 'coupon' || gift.kind === 'certificate' || gift.kind === 'postcard') && (
            <Btn
              kind="soft"
              onClick={() => {
                const text =
                  gift.kind === 'coupon'
                    ? `🎟 Активую купон №${gift.no}: «${COUPON_TITLE}». Моє бажання: `
                    : gift.kind === 'certificate'
                      ? `📜 ${gift.title} №${gift.no}. Чекаю на обійми! ❤️`
                      : `💌 ${gift.card.title}. ${gift.card.text}`
                shareText('МурLove', text, () => toast('Текст скопійовано — надішли його Ігорю 💌'))
              }}
            >
              Надіслати Ігорю 💌
            </Btn>
          )}
        </div>
      </Sheet>
    </div>
  )
}

function GiftCard({ gift, k }: { gift: Gift; k: number }) {
  switch (gift.kind) {
    case 'love':
      return (
        <div className="gift-card g-love" key={k}>
          <HeartSvg className="g-heart" />
          <p className="g-text">{gift.text}</p>
          <p className="sign">{SIGN}</p>
        </div>
      )
    case 'postcard':
      return (
        <div className={'gift-card postcard pc-' + gift.card.theme} key={k}>
          <div className="pc-deco" aria-hidden="true">
            {Array.from({ length: 9 }, (_, i) => (
              <i key={i} style={{ left: ((i * 37) % 90) + 3 + '%', top: ((i * 53) % 82) + 4 + '%', animationDelay: (i % 4) * 0.7 + 's' }} />
            ))}
          </div>
          <h3>{gift.card.title}</h3>
          <p>{gift.card.text}</p>
          <p className="sign">{SIGN}</p>
        </div>
      )
    case 'fluffy':
      return (
        <div className="gift-card g-fluffy" key={k}>
          <div className={'g-pet anim-' + gift.anim}>
            <Pet id={gift.pet} state={gift.state} />
          </div>
          <p className="g-text">{gift.text}</p>
        </div>
      )
    case 'joke':
      return (
        <div className="gift-card g-joke" key={k}>
          <div className="g-pet small anim-wiggle">
            <Pet id="hamster" state="happy" />
          </div>
          <p className="g-text pre">{gift.text}</p>
        </div>
      )
    case 'flower':
      return (
        <div className="gift-card g-flower" key={k}>
          <FlowerSvg f={gift.flower} className="flower-svg" />
          <h3>{gift.flower.name}</h3>
          <p className="g-text">{gift.flower.text}</p>
          <p className="sign">{SIGN}</p>
        </div>
      )
    case 'kiss':
      return (
        <div className="gift-card g-kiss" key={k}>
          <LipsSvg className="g-lips" />
          <p className="g-text">{gift.text}</p>
          <p className="sign">{SIGN}</p>
        </div>
      )
    case 'certificate':
      return (
        <div className="gift-card cert" key={k}>
          <div className="cert-inner">
            <p className="cert-kicker">СЕРТИФІКАТ № {gift.no}</p>
            <h3>{gift.title}</h3>
            <dl>
              <dt>Власниця</dt>
              <dd>Мар’яна</dd>
              <dt>Термін дії</dt>
              <dd>назавжди</dd>
              <dt>Обмін і повернення</dt>
              <dd>не передбачені</dd>
            </dl>
            <div className="cert-foot">
              <span>Видав: Ігор</span>
              <span className="seal">
                <HeartSvg fill="url(#mg-gold)" gloss={false} />
              </span>
            </div>
          </div>
        </div>
      )
    case 'coupon':
      return (
        <div className="gift-card coupon" key={k}>
          <div className="coupon-left">
            <span>КУПОН</span>
            <b>№ {gift.no}</b>
          </div>
          <div className="coupon-main">
            <h3>{COUPON_TITLE}</h3>
            <p>Пред’яви Ігорю — він виконає з посмішкою. Діє без обмежень у часі.</p>
          </div>
        </div>
      )
  }
}
