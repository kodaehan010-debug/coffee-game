import { useEffect, useState } from 'react'
import { shuffle } from '../lib/draw'
import { raceStep } from '../lib/rules'
import { beep } from '../lib/sound'
import type { GameProps } from './registry'
import Horse from '../components/Horse'

const GOAL = 100
const TICK_MS = 120
// 차분한 말 색상 팔레트
const COLORS = ['#c9a27e', '#a9b8c9', '#d8c3a5', '#b7c9a8', '#c7b2d6', '#e0b9a0', '#9fb5b0', '#d6c6b0']

// 모든 말이 랜덤 속도로 전진. 결승선에 늦게 들어온 k명 당첨
export default function Race({ players, winners, sound, onFinish }: GameProps) {
  const [pos, setPos] = useState(() => players.map(() => 0))
  const [order, setOrder] = useState<number[]>([]) // 도착 순서(인덱스)
  const [running, setRunning] = useState(false)

  useEffect(() => {
    if (!running) return
    const t = setInterval(() => {
      setPos((prev) => raceStep(prev).map((p) => Math.min(GOAL, p)))
    }, TICK_MS)
    return () => clearInterval(t)
  }, [running])

  // 새로 도착한 말을 순서에 추가 (같은 틱 동시 도착은 무작위 순서)
  useEffect(() => {
    const arrived = pos.map((p, i) => (p >= GOAL && !order.includes(i) ? i : -1)).filter((i) => i >= 0)
    if (!arrived.length || order.length >= players.length - winners) return
    const next = [...order, ...shuffle(arrived)]
    setOrder(next)
    beep(600 + next.length * 10, 40, sound)
    if (next.length >= players.length - winners) {
      // 남은 k명 = 꼴찌들 → 당첨. 더 볼 필요 없이 종료
      setRunning(false)
      const losers = players.filter((_, i) => !next.slice(0, players.length - winners).includes(i))
      setTimeout(() => onFinish(losers), 1200)
    }
  }, [pos, order, players, winners, sound, onFinish])

  return (
    <div>
      <div className={`race${players.length > 12 ? ' compact' : ''}`}>
        {players.map((p, i) => {
          const rank = order.indexOf(i)
          const done = pos[i] >= GOAL
          return (
            <div key={p} className="lane">
              <span className="lane-name">{p}</span>
              <div className="track">
                {/* 래퍼 폭 = 트랙 폭 → (100% - 말 폭) × 진행률 만큼 이동, 100이면 코끝이 결승선 */}
                <div className="runner-wrap" style={{ transform: `translateX(calc((100% - var(--horse-w)) * ${pos[i] / GOAL}))` }}>
                  <Horse color={COLORS[i % COLORS.length]} running={running && !done} />
                  {rank >= 0 && <span className="runner-rank">{rank + 1}</span>}
                </div>
              </div>
            </div>
          )
        })}
      </div>
      {!running && order.length === 0 && (
        <button className="primary big" onClick={() => setRunning(true)}>
          출발
        </button>
      )}
    </div>
  )
}
