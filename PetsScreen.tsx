// «Пухнастий антистрес» — світ із шістьма пухнастиками.
import { useRef, useState } from 'react'
import { Pet, PET_IDS, type PetId } from './pets'
import { PETS } from './content'
import { PetStage, type PetStageApi } from './PetStage'
import { Btn } from './ui'
import { play, unlockAudio } from './sound'
import { haptic } from './device'

export function PetsScreen() {
  const [id, setId] = useState<PetId>('kitty')
  const stage = useRef<PetStageApi>(null)
  const def = PETS[id]

  return (
    <div className="pets">
      <h1 className="title">Пухнастий антистрес 🐾</h1>
      <div className="pet-picker" role="tablist" aria-label="Пухнастики">
        {PET_IDS.map((p) => (
          <button
            key={p}
            role="tab"
            aria-selected={p === id}
            className={'pick' + (p === id ? ' on' : '')}
            onClick={() => {
              unlockAudio()
              if (p !== id) {
                play('pop')
                haptic('light')
                setId(p)
              }
            }}
          >
            <span className="pick-face">
              <Pet id={p} mini />
            </span>
            <span className="pick-name">{PETS[p].name}</span>
          </button>
        ))}
      </div>

      <div className="pet-title">
        <b>{def.full}</b>
        <span>{def.trait}</span>
      </div>

      <PetStage id={id} ref={stage} key={id} />

      <div className="treats" aria-label="Смаколики">
        {def.treats.map((t, i) => (
          <button
            key={t.name}
            className="treat"
            onClick={(e) => {
              unlockAudio()
              haptic('light')
              stage.current?.feed(i, e.currentTarget)
            }}
          >
            <span className="treat-emoji">{t.emoji}</span>
            <span className="treat-name">{t.name}</span>
          </button>
        ))}
      </div>

      <Btn kind="soft" className="paw-btn" onClick={() => stage.current?.paw()}>
        🐾 Дай лапку — отримай сюрприз
      </Btn>

      <p className="hint">Погладь пальчиком · торкнися · потримай довше — у кожного свій секрет</p>
    </div>
  )
}
