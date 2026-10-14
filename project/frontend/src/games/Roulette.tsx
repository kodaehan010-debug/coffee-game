import { useState } from 'react'
import { randInt } from '../lib/draw'
import { beep } from '../lib/sound'
import type { GameProps } from './registry'

const COLORS = ['#f6c177', '#9ccfd8', '#c4a7e7', '#ebbcba', '#a3be8c', '#f2cdcd']
const SPIN_MS = 4000

// 당첨 인원만큼 돌림. 한 번 당첨된 사람은 원판에서 빠짐
export default function Roulette({ players, winners, sound, onFinish }: GameProps) {
  const [pool, setPool] = useState(players)
  const [won, setWon] = useState<string[]>([])
  const [angle, setAngle] = useState(0)
  const [spinning, setSpinning] = useState(false)
  const [last, setLast] = useState<string | null>(null)

  const n = pool.length
  const slice = 360 / n
  const small = n > 20 // 20명 초과 시 번호 표시

  const spin = () => {
    const idx = randInt(n)
    // 포인터(12시)에 idx 칸 중앙이 오도록: 칸 중앙 각도 = (idx + 0.5) * slice
    const jitter = (randInt(60) / 100 - 0.3) * slice
    const target = 360 - ((idx + 0.5) * slice + jitter)
    const next = angle - (angle % 360) + 360 * 6 + target
    setSpinning(true)
    setLast(null)
    setAngle(next)
    const tick = setInterval(() => beep(500, 20, sound), 150)
    setTimeout(() => {
      clearInterval(tick)
      const w = pool[idx]
      const all = [...won, w]
      setSpinning(false)
      setLast(w)
      if (all.length >= winners) return onFinish(all)
      setWon(all)
      setPool(pool.filter((p) => p !== w))
      setAngle(0)
    }, SPIN_MS)
  }

  const r = 160
  const pt = (deg: number) => {
    const rad = ((deg - 90) * Math.PI) / 180
    return [r + r * Math.cos(rad), r + r * Math.sin(rad)]
  }

  return (
    <div>
      <div className="wheel-wrap">
        <div className="pointer">▼</div>
        <svg
          viewBox={`0 0 ${r * 2} ${r * 2}`}
          className="wheel"
          style={{
            transform: `rotate(${angle}deg)`,
            transition: spinning ? `transform ${SPIN_MS}ms cubic-bezier(.15,.7,.2,1)` : 'none',
          }}
        >
          {pool.map((name, i) => {
            const [x1, y1] = pt(i * slice)
            const [x2, y2] = pt((i + 1) * slice)
            const mid = (i + 0.5) * slice
            const [tx, ty] = pt(mid).map((v) => r + (v - r) * 0.65)
            return (
              <g key={name}>
                {n === 1 ? (
                  <circle cx={r} cy={r} r={r} fill={COLORS[0]} />
                ) : (
                  <path
                    d={`M${r},${r} L${x1},${y1} A${r},${r} 0 ${slice > 180 ? 1 : 0} 1 ${x2},${y2} Z`}
                    fill={COLORS[i % COLORS.length]}
                    stroke="#fff"
                  />
                )}
                <text
                  x={tx}
                  y={ty}
                  fontSize={small ? 10 : 14}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  transform={`rotate(${mid} ${tx} ${ty})`}
                >
                  {small ? i + 1 : name}
                </text>
              </g>
            )
          })}
        </svg>
      </div>

      {small && (
        <ol className="legend">
          {pool.map((p) => <li key={p}>{p}</li>)}
        </ol>
      )}
      {last && <p className="big-text">🎯 {last}</p>}
      {won.length > 0 && <p className="muted">당첨: {won.join(', ')}</p>}
      <button className="primary big" onClick={spin} disabled={spinning}>
        {spinning ? '돌아가는 중…' : `돌리기 (${won.length + 1}/${winners})`}
      </button>
    </div>
  )
}
