// «Генератор гарного настрою»: кожне натискання — нова кумедна сценка.
import { useRef, useState } from 'react'
import { Pet, type PetState } from './pets'
import { JOKES, PETS, type Joke } from './content'
import { Btn } from './ui'
import { play } from './sound'
import { burst, centerOf } from './fx'
import { bump, pick, useStore } from './store'

const STATE_FOR: Record<string, PetState> = {
  sleep: 'sleep',
  flip: 'happy',
  sway: 'happy',
}

export function LaughScreen() {
  const [joke, setJoke] = useState<Joke | null>(null)
  const [k, setK] = useState(0)
  const laughs = useStore((s) => s.stats.laughs)
  const stageRef = useRef<HTMLDivElement>(null)

  const next = () => {
    const j = JOKES[pick('jokes', JOKES.length)]
    setJoke(j)
    setK((x) => x + 1)
    bump('laughs')
    play(PETS[j.pet].sounds.tap)
    setTimeout(() => play('giggle'), 650)
    const [x, y] = centerOf(stageRef.current)
    setTimeout(() => burst(x, y - 20, { count: 12, kinds: ['star', 'heart', 'sparkle'], spread: 140 }), 200)
  }

  const pet = joke?.pet ?? 'hamster'
  const st: PetState = joke ? STATE_FOR[joke.anim || ''] ?? 'happy' : 'idle'

  return (
    <div className="laugh">
      <h1 className="title">Генератор гарного настрою 😂</h1>
      <div className="laugh-stage" ref={stageRef}>
        <div className="stage-glow" />
        <div key={k} className={'laugh-pet anim-' + (joke?.anim || 'idle')}>
          <Pet id={pet} state={st} />
        </div>
      </div>
      <section className="card glass joke-card" aria-live="polite">
        {joke ? (
          <p key={k} className="joke-text">
            {joke.text}
          </p>
        ) : (
          <p className="joke-text muted">Натисни кнопку — і пухнастики влаштують для тебе маленьке шоу.</p>
        )}
      </section>
      <Btn className="cta" onClick={next}>
        Розсміши мене 😂
      </Btn>
      {laughs > 0 && <p className="hint">Порцій сміху вже: {laughs}. Ще одна точно не завадить!</p>}
    </div>
  )
}
