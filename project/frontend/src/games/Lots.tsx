import { useState } from 'react'
import { shuffle } from '../lib/draw'
import { beep } from '../lib/sound'
import type { GameProps } from './registry'

// 카드 = 참가자 수. 각자 카드 한 장씩 골라 뒤집음. 당첨 카드 k장
export default function Lots({ players, winners, sound, onFinish }: GameProps) {
  const [cards] = useState(() => shuffle(players.map((_, i) => i < winners)))
  const [owner, setOwner] = useState<(string | null)[]>(() => players.map(() => null))
  const turn = players[owner.filter(Boolean).length] // 다음 차례

  const pick = (i: number) => {
    if (owner[i] || !turn) return
    const next = [...owner]
    next[i] = turn
    setOwner(next)
    beep(cards[i] ? 880 : 440, 120, sound)
    if (next.every(Boolean)) {
      const w = next.filter((_, j) => cards[j]) as string[]
      setTimeout(() => onFinish(w), 1200)
    }
  }

  const revealAll = () => {
    const rest = shuffle(players.filter((p) => !owner.includes(p)))
    let k = 0
    const next = owner.map((o) => o ?? rest[k++])
    setOwner(next)
    setTimeout(() => onFinish(next.filter((_, j) => cards[j]) as string[]), 1200)
  }

  return (
    <div>
      {turn && <p className="big-text">{turn} 님 차례</p>}
      <div className="lots">
        {cards.map((win, i) => (
          <button key={i} className={`lot ${owner[i] ? (win ? 'win' : 'open') : ''}`} onClick={() => pick(i)}>
            {owner[i] ? (
              <>
                <span className={`badge ${win ? 'hit' : 'miss'}`}>{win ? '당첨' : '꽝'}</span>
                <small>{owner[i]}</small>
              </>
            ) : (
              '?'
            )}
          </button>
        ))}
      </div>
      {turn && (
        <button className="link" onClick={revealAll}>
          남은 사람 자동 배정
        </button>
      )}
    </div>
  )
}
