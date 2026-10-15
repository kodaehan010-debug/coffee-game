import { useEffect, useRef, useState } from 'react'
import { weightedIndex } from '../lib/draw'
import { beep } from '../lib/sound'
import type { GameProps } from './registry'

// 사용자 요청에 따른 DESIGN.md 600ms 제한의 "사용자 선택 예외": 실제 회전 + 감속 정지
const SPIN_MS = 5000
const TURNS = 5 // 최소 회전 바퀴 수
const FILLS = ['#FFFFFF', '#F3F4F6']

const reducedMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
const easeOut = (t: number) => 1 - (1 - t) ** 4 // 강한 감속

// 휠이 회전 후 천천히 멈춤. 상단 고정 포인터 아래 칸이 당첨. 당첨 인원만큼 반복(당첨자 제외)
export default function Roulette({ players, winners, sound, weight, onFinish }: GameProps) {
  const [pool, setPool] = useState(players)
  const [won, setWon] = useState<string[]>([])
  const [rot, setRot] = useState(0) // 누적 회전각(도, 시계방향)
  const [hit, setHit] = useState<number | null>(null)
  const [spinning, setSpinning] = useState(false)
  const [last, setLast] = useState<string | null>(null)
  const raf = useRef(0)
  const timer = useRef(0)

  useEffect(
    () => () => {
      cancelAnimationFrame(raf.current)
      clearTimeout(timer.current)
    },
    [],
  )

  const n = pool.length
  const slice = 360 / n
  const small = n > 20 // 20명 초과 시 번호 표시

  const stop = (idx: number) => {
    const w = pool[idx]
    const all = [...won, w]
    setHit(idx)
    setLast(w)
    timer.current = window.setTimeout(() => {
      if (all.length >= winners) return onFinish(all)
      setSpinning(false)
      setWon(all)
      setPool(pool.filter((p) => p !== w))
      setHit(null)
    }, 1200)
  }

  const spin = () => {
    const idx = weightedIndex(pool.map(weight))
    setSpinning(true)
    setLast(null)
    setHit(null)

    // 칸 중심(+칸 안 약간의 무작위 위치)이 상단 포인터(0°)에 오도록 목표각 계산
    const jitter = (Math.random() - 0.5) * slice * 0.6
    const center = (idx + 0.5) * slice + jitter
    const from = rot
    const delta = (((360 - center - from) % 360) + 360) % 360
    const to = from + TURNS * 360 + delta

    if (reducedMotion()) {
      setRot(to)
      return stop(idx)
    }

    const t0 = performance.now()
    let lastTick = Math.floor(from / slice)
    const frame = (now: number) => {
      const p = Math.min(1, (now - t0) / SPIN_MS)
      const a = from + (to - from) * easeOut(p)
      setRot(a)
      const tick = Math.floor(a / slice) // 칸 경계 통과 시 틱(감속에 따라 자연히 느려짐)
      if (tick !== lastTick) {
        lastTick = tick
        beep(500, 12, sound)
      }
      if (p < 1) raf.current = requestAnimationFrame(frame)
      else stop(idx)
    }
    raf.current = requestAnimationFrame(frame)
  }

  const r = 160
  const pt = (deg: number, rr = r) => {
    const rad = ((deg - 90) * Math.PI) / 180
    return [r + rr * Math.cos(rad), r + rr * Math.sin(rad)]
  }
  const arc = (i: number) => {
    const [x1, y1] = pt(i * slice)
    const [x2, y2] = pt((i + 1) * slice)
    return n === 1
      ? `M${r},0 A${r},${r} 0 1 1 ${r - 0.01},0 Z`
      : `M${r},${r} L${x1},${y1} A${r},${r} 0 ${slice > 180 ? 1 : 0} 1 ${x2},${y2} Z`
  }

  return (
    <div>
      <svg viewBox={`-4 -20 ${r * 2 + 8} ${r * 2 + 24}`} className="wheel" role="img" aria-label="룰렛">
        <g transform={`rotate(${rot} ${r} ${r})`}>
          {pool.map((name, i) => {
            const mid = (i + 0.5) * slice
            const [tx, ty] = pt(mid, r * 0.65)
            const on = hit === i
            return (
              <g key={name}>
                <path d={arc(i)} fill={on ? '#FDECEF' : FILLS[i % 2]} stroke="#E5E7EB" />
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
          {/* 당첨 칸 테두리는 마지막에 그려 이웃 칸에 가려지지 않게 */}
          {hit != null && hit < n && (
            <path d={arc(hit)} fill="none" stroke="#E0002A" strokeWidth={3} strokeLinejoin="round" />
          )}
        </g>
        <circle cx={r} cy={r} r={6} fill="#FFFFFF" stroke="#D1D5DB" />
        {/* 상단 고정 포인터 */}
        <path d={`M${r - 12},-16 L${r + 12},-16 L${r},8 Z`} fill="#E0002A" />
      </svg>

      {small && (
        <ol className="legend">
          {pool.map((p) => <li key={p}>{p}</li>)}
        </ol>
      )}
      <p className="big-text" aria-live="polite">{last ?? ' '}</p>
      {won.length > 0 && <p className="muted">당첨: {won.join(', ')}</p>}
      <button className="primary big" onClick={spin} disabled={spinning}>
        {spinning ? '돌아가는 중…' : `돌리기 (${won.length + 1}/${winners})`}
      </button>
    </div>
  )
}
