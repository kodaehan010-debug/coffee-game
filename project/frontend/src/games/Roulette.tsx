import { useEffect, useRef, useState } from 'react'
import { randInt } from '../lib/draw'
import { beep } from '../lib/sound'
import type { GameProps } from './registry'

const TOTAL_MS = 4000 // 전체 연출 시간 (칸 이동 1회 = 짧은 색 전환)
const FILLS = ['#FFFFFF', '#F3F4F6']

const reducedMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

// 강조 칸이 한 칸씩 이동하며 점점 느려지다 멈춤. 당첨 인원만큼 반복(당첨자 제외)
export default function Roulette({ players, winners, sound, onFinish }: GameProps) {
  const [pool, setPool] = useState(players)
  const [won, setWon] = useState<string[]>([])
  const [cursor, setCursor] = useState<number | null>(null)
  const [spinning, setSpinning] = useState(false)
  const [last, setLast] = useState<string | null>(null)
  const timers = useRef<number[]>([])

  useEffect(() => () => timers.current.forEach(clearTimeout), [])

  const n = pool.length
  const slice = 360 / n
  const small = n > 20 // 20명 초과 시 번호 표시

  const stop = (idx: number) => {
    const w = pool[idx]
    const all = [...won, w]
    setLast(w)
    if (all.length >= winners) return void setTimeout(() => onFinish(all), 800)
    setTimeout(() => {
      setSpinning(false)
      setWon(all)
      setPool(pool.filter((p) => p !== w))
      setCursor(null)
    }, 800)
  }

  const spin = () => {
    const idx = randInt(n)
    setSpinning(true)
    setLast(null)
    if (reducedMotion()) return stop(idx)

    // 2바퀴 + 목표 칸까지 이동. 이동 간격은 점점 길어짐(합계 ≈ TOTAL_MS)
    const start = cursor ?? 0
    const steps = 2 * n + ((idx - start + n) % n)
    const base = TOTAL_MS / (3 * steps)
    let t = 0
    timers.current = []
    for (let i = 1; i <= steps; i++) {
      t += base * (1 + 6 * (i / steps) ** 2)
      const pos = (start + i) % n
      timers.current.push(
        window.setTimeout(() => {
          setCursor(pos)
          beep(500, 15, sound)
          if (i === steps) stop(idx)
        }, t),
      )
    }
  }

  const r = 160
  const pt = (deg: number, rr = r) => {
    const rad = ((deg - 90) * Math.PI) / 180
    return [r + rr * Math.cos(rad), r + rr * Math.sin(rad)]
  }

  return (
    <div>
      <svg viewBox={`-4 -4 ${r * 2 + 8} ${r * 2 + 8}`} className="wheel" role="img" aria-label="룰렛">
        {pool.map((name, i) => {
          const [x1, y1] = pt(i * slice)
          const [x2, y2] = pt((i + 1) * slice)
          const mid = (i + 0.5) * slice
          const [tx, ty] = pt(mid, r * 0.65)
          const on = cursor === i
          return (
            <g key={name}>
              <path
                d={`M${r},${r} L${x1},${y1} A${r},${r} 0 ${slice > 180 ? 1 : 0} 1 ${x2},${y2} Z`}
                fill={on ? '#FDECEF' : FILLS[i % 2]}
                stroke="#E5E7EB"
              />
              <text
                x={tx}
                y={ty}
                fontSize={small ? 10 : 14}
                fontWeight={on ? 700 : 400}
                fill={on ? '#E0002A' : '#374151'}
                textAnchor="middle"
                dominantBaseline="middle"
                transform={`rotate(${mid} ${tx} ${ty})`}
              >
                {small ? i + 1 : name}
              </text>
            </g>
          )
        })}
        {/* 강조 테두리는 마지막에 그려 이웃 칸에 가려지지 않게 */}
        {cursor != null && cursor < n && (() => {
          const [x1, y1] = pt(cursor * slice)
          const [x2, y2] = pt((cursor + 1) * slice)
          return (
            <path
              d={`M${r},${r} L${x1},${y1} A${r},${r} 0 ${slice > 180 ? 1 : 0} 1 ${x2},${y2} Z`}
              fill="none"
              stroke="#E0002A"
              strokeWidth={3}
              strokeLinejoin="round"
            />
          )
        })()}
      </svg>

      {small && (
        <ol className="legend">
          {pool.map((p) => <li key={p}>{p}</li>)}
        </ol>
      )}
      {last && <p className="big-text">{last}</p>}
      {won.length > 0 && <p className="muted">당첨: {won.join(', ')}</p>}
      <button className="primary big" onClick={spin} disabled={spinning}>
        {spinning ? '돌아가는 중…' : `돌리기 (${won.length + 1}/${winners})`}
      </button>
    </div>
  )
}
