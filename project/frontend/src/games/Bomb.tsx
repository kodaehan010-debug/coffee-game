import { useEffect, useRef, useState } from 'react'
import { randInt, weightedIndex } from '../lib/draw'
import Icon from '../components/Icon'
import { beep, boom } from '../lib/sound'
import type { GameProps } from './registry'

// 다음 보유자: 당첨 보정 가중치 비례
const pickOther = (list: string[], weight: (n: string) => number, except?: string | null) => {
  const others = list.filter((p) => p !== except)
  return others[weightedIndex(others.map(weight))]
}

// 폭탄을 랜덤한 다른 사람에게 넘김. 숨겨진 시간(5~15초) 후 폭발 → 들고 있던 사람 당첨
export default function Bomb({ players, winners, sound, weight, onFinish }: GameProps) {
  const [pool, setPool] = useState(players)
  const [won, setWon] = useState<string[]>([])
  const [holder, setHolder] = useState<string | null>(null)
  const [round, setRound] = useState(0) // 0 = 대기, 시작마다 +1
  const [loser, setLoser] = useState<string | null>(null)
  const holderRef = useRef<string | null>(null)

  useEffect(() => {
    holderRef.current = holder
  }, [holder])

  // 라운드 타이머: 폭발 시 그 순간 들고 있던 사람 확정
  useEffect(() => {
    if (!round) return
    const tick = setInterval(() => beep(700, 30, sound), 500)
    const t = setTimeout(() => {
      clearInterval(tick)
      boom(sound)
      setLoser(holderRef.current)
    }, 5000 + randInt(10000))
    return () => {
      clearTimeout(t)
      clearInterval(tick)
    }
  }, [round, sound])

  // 폭발 후 처리: 목표 인원 도달 시 종료, 아니면 다음 라운드 대기
  useEffect(() => {
    if (!loser) return
    const t = setTimeout(() => {
      const all = [...won, loser]
      if (all.length >= winners) return onFinish(all)
      setWon(all)
      setPool((p) => p.filter((x) => x !== loser))
      setHolder(null)
      setLoser(null)
      setRound(0)
    }, 1500)
    return () => clearTimeout(t)
  }, [loser, won, winners, onFinish])

  const start = () => {
    setHolder(pickOther(pool, weight))
    setRound((r) => r + 1)
  }

  const pass = () => {
    beep(900, 50, sound)
    setHolder(pickOther(pool, weight, holder))
  }

  return (
    <div>
      {won.length > 0 && <p className="muted">당첨: {won.join(', ')}</p>}
      {!holder ? (
        <button className="primary big" onClick={start}>
          시작 ({won.length + 1}/{winners})
        </button>
      ) : (
        <>
          <div className={`bomb ${loser ? 'boom' : ''}`}>
            <Icon name="bomb" size={120} />
          </div>
          <p className="big-text">{holder}</p>
          {loser && <p><span className="badge hit">펑! 당첨</span></p>}
          {!loser && (
            <button className="primary big" onClick={pass}>
              넘기기
            </button>
          )}
        </>
      )}
    </div>
  )
}
