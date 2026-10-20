import { useEffect, useRef, useState } from 'react'
import { weightedIndex } from '../lib/draw'
import { beep } from '../lib/sound'
import type { GameProps } from './registry'

// 사용자 요청에 따른 DESIGN.md 600ms 제한의 "사용자 선택 예외": 실제 회전 + 감속 정지
const SPIN_MS = 5000
const TURNS = 5 // 최소 회전 바퀴 수
// 파스텔 칸 색 (글자 #374151 대비 4.5:1 이상)
const FILLS = ['#FDE2E7', '#FFE8D6', '#FFF4CC', '#DDF3E4', '#DCEFFB', '#E6E3FA', '#F8E1F4', '#E8EEF2']

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
  const pointer = useRef<SVGPathElement>(null)
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
  const small = n > 30 // 30명 초과 시 번호 표시

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
        const el = pointer.current // 칸 통과 시 포인터 흔들림 재시작
        if (el) { el.classList.remove('tick'); void el.getBoundingClientRect(); el.classList.add('tick') }
      }
      if (p < 1) raf.current = requestAnimationFrame(frame)
      else stop(idx)
    }
    raf.current = requestAnimationFrame(frame)
  }

  const r = 160
  const rim = 14 // 바깥 테두리 두께
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

  const dots = Array.from({ length: 24 }, (_, i) => pt(i * 15, r + rim / 2))
  const fontSize = small ? 10 : n > 20 ? 11 : n > 12 ? 13 : 15
  const label = (name: string) => (name.length > 6 ? name.slice(0, 6) + '…' : name)

  return (
    <div className="rl">
      <div className="rl-stage">
        <svg viewBox={`${-rim - 4} ${-rim - 24} ${r * 2 + rim * 2 + 8} ${r * 2 + rim * 2 + 28}`} className="wheel" role="img" aria-label="룰렛">
          <circle cx={r} cy={r} r={r + rim / 2} fill="none" stroke="#374151" strokeWidth={rim} />
          {dots.map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r={2.6} className={`rl-dot ${spinning && i % 2 === Math.floor(rot / 30) % 2 ? 'on' : ''}`} />
          ))}
          <g transform={`rotate(${rot} ${r} ${r})`}>
            {pool.map((name, i) => {
              const mid = (i + 0.5) * slice
              const [tx, ty] = pt(mid, r * 0.68)
              const on = hit === i
              return (
                <g key={name}>
                  <path d={arc(i)} fill={on ? '#FFFFFF' : FILLS[i % FILLS.length]} stroke="#FFFFFF" strokeWidth={1.5} />
                  <text
                    x={tx}
                    y={ty}
                    fontSize={fontSize}
                    fontWeight={on ? 700 : 600}
                    fill={on ? '#E0002A' : '#374151'}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    transform={`rotate(${mid - 90} ${tx} ${ty})`}
                  >
                    {small ? i + 1 : label(name)}
                  </text>
                </g>
              )
            })}
            {/* 당첨 칸 테두리는 마지막에 그려 이웃 칸에 가려지지 않게 */}
            {hit != null && hit < n && (
              <path d={arc(hit)} fill="none" stroke="#E0002A" strokeWidth={4} strokeLinejoin="round" />
            )}
          </g>
          {/* 상단 고정 포인터 */}
          <path ref={pointer} className="rl-pointer" d={`M${r - 14},${-rim - 20} L${r + 14},${-rim - 20} L${r},${4} Z`} fill="#E0002A" stroke="#FFFFFF" strokeWidth={2} strokeLinejoin="round" />
        </svg>
        <button className="primary rl-hub" onClick={spin} disabled={spinning} aria-label="룰렛 돌리기">
          {spinning ? '…' : 'START'}
          <small className="tnum">{won.length + 1}/{winners}</small>
        </button>
      </div>

      <div className="rl-result" aria-live="polite">
        {last ? <div key={last} className="rl-card"><span>당첨</span><strong>{last}</strong></div> : <p className="muted">{spinning ? '돌아가는 중…' : '가운데 START 를 눌러 돌리기'}</p>}
      </div>

      <div className="rl-status">
        <span className="muted tnum">남은 인원 {n} 명</span>
        {won.length > 0 && (
          <ul className="rl-chips">
            {won.map((w) => <li key={w}>{w}</li>)}
          </ul>
        )}
      </div>

      {small && (
        <ol className="legend">
          {pool.map((p) => <li key={p}>{p}</li>)}
        </ol>
      )}
    </div>
  )
}
