import { useEffect, useRef, useState } from 'react'
import { makeLadder, makePrizes, pathCorners, stepDurations, tracePath } from '../lib/ladder'
import { beep } from '../lib/sound'
import type { GameProps } from './registry'

const COL_W = 64
const ROW_H = 28
const PAD = 36
const PATH_COLOR = '#E0002A'
const TOTAL_MS = 5000 // 경로 1개 이동 총 시간
const reducedMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

export default function Ladder({ players, winners, sound, onFinish }: GameProps) {
  const n = players.length
  const [ladder] = useState(() => makeLadder(n))
  const [prizes] = useState(() => makePrizes(n, winners))
  const [shown, setShown] = useState<number[]>([]) // 도착 완료된 출발 번호
  const [runs, setRuns] = useState<Record<number, { k: number; ms: number }>>({}) // 이동 중 마커: k번째 점까지 진행
  const [last, setLast] = useState<number | null>(null)
  const timers = useRef<number[]>([])
  const lastBeep = useRef(0)
  useEffect(() => () => timers.current.forEach(clearTimeout), [])

  const w = PAD * 2 + COL_W * (n - 1)
  const h = ROW_H * (ladder.rows + 1)
  const x = (c: number) => PAD + c * COL_W
  const y = (r: number) => (r < 0 ? 0 : r >= ladder.rows ? h : ROW_H * (r + 0.5))

  const results = players.map((_, i) => tracePath(ladder, i))
  const corners = players.map((_, i) => pathCorners(ladder, i))
  const win = (i: number) => prizes[results[i].end]
  const runIds = Object.keys(runs).map(Number)
  const running = runIds.length > 0
  const hot = (i: number) => win(i) || i === last || i in runs

  const done = useRef(false)
  const finish = () => {
    if (done.current) return
    done.current = true
    timers.current.push(window.setTimeout(() => onFinish(players.filter((_, i) => win(i))), 1500))
  }

  // 동시 진행 시 같은 틱의 소리는 1번만
  const tick = (freq: number, ms: number) => {
    const now = performance.now()
    if (now - lastBeep.current < 50) return
    lastBeep.current = now
    beep(freq, ms, sound)
  }

  const arrive = (ids: number[]) => {
    setRuns((r) => {
      const next = { ...r }
      ids.forEach((i) => delete next[i])
      return next
    })
    setLast(ids[ids.length - 1])
    setShown((prev) => {
      const next = [...prev, ...ids.filter((i) => !prev.includes(i))]
      if (next.length === n && prev.length < n) finish()
      return next
    })
    if (ids.length === 1) beep(win(ids[0]) ? 880 : 300, win(ids[0]) ? 240 : 160, sound)
    else tick(ids.some(win) ? 880 : 300, 200)
  }

  const launch = (i: number) => {
    const pts = corners[i]
    const durs = stepDurations(pts, ladder.rows, TOTAL_MS)
    let t = 60 // 마커가 출발점에 먼저 그려지도록
    durs.forEach((ms, s) => {
      timers.current.push(
        window.setTimeout(() => {
          setRuns((r) => ({ ...r, [i]: { k: s + 1, ms } }))
          const horizontal = pts[s + 1][1] === pts[s][1]
          tick(horizontal ? 740 : 560, 40) // 꺾일 때 높은음
        }, t),
      )
      t += ms
    })
    setRuns((r) => ({ ...r, [i]: { k: 0, ms: 0 } }))
    timers.current.push(window.setTimeout(() => arrive([i]), t + 150))
  }

  const start = (i: number) => {
    if (running || shown.includes(i)) return
    if (reducedMotion()) return arrive([i])
    launch(i)
  }

  const startAll = () => {
    const todo = players.map((_, i) => i).filter((i) => !shown.includes(i))
    if (running || !todo.length) return
    if (reducedMotion()) return arrive(todo)
    todo.forEach(launch)
  }

  const showAll = () => {
    if (running) return
    setShown(players.map((_, i) => i))
    finish()
  }

  const toXY = ([c, r]: [number, number]) => `${x(c)},${y(r)}`
  const fullPoints = (i: number) => corners[i].map(toXY).join(' ')
  const multi = runIds.length > 1

  return (
    <div>
      <p className="muted">{running ? (multi ? `${runIds.length}명 이동 중...` : `${players[runIds[0]]} 이동 중...`) : '이름을 눌러 출발'}</p>
      <div className="table-wrap">
        <div style={{ width: w, margin: '0 auto' }}>
          <div className="ladder-labels">
            {players.map((p, i) => (
              <button
                key={p}
                style={{ left: x(i) }}
                className={shown.includes(i) || i in runs ? 'on' : ''}
                disabled={running && !(i in runs)}
                onClick={() => start(i)}
              >
                {p}
              </button>
            ))}
          </div>
          <svg width={w} height={h} style={{ overflow: 'visible' }}>
            {players.map((_, c) => (
              <line key={c} x1={x(c)} y1={0} x2={x(c)} y2={h} stroke="#D1D5DB" strokeWidth={3} />
            ))}
            {ladder.rungs.map((row, r) =>
              row.map((c) => (
                <line key={`${r}-${c}`} x1={x(c)} y1={y(r)} x2={x(c + 1)} y2={y(r)} stroke="#D1D5DB" strokeWidth={3} />
              )),
            )}
            {/* 당첨 경로·방금 도착 경로는 빨강(위에 그림), 나머지는 회색 */}
            {[...shown]
              .sort((a, b) => Number(hot(a)) - Number(hot(b)))
              .map((i) => (
                <polyline
                  key={i}
                  points={fullPoints(i)}
                  fill="none"
                  stroke={hot(i) ? PATH_COLOR : '#9CA3AF'}
                  strokeWidth={hot(i) ? 5 : 3}
                />
              ))}
            {runIds.map((i) => {
              const { k, ms } = runs[i]
              const pts = corners[i]
              const [tc, tr] = pts[k]
              const off = multi ? ((i % 3) - 1) * 4 : 0 // 겹침 완화용 작은 오프셋
              return (
                <g key={i}>
                  <polyline
                    points={pts.slice(0, k).map(toXY).join(' ')}
                    fill="none"
                    stroke={PATH_COLOR}
                    strokeWidth={multi ? 3 : 5}
                    strokeOpacity={0.5}
                  />
                  <g
                    className="ladder-marker"
                    style={{ transform: `translate(${x(tc) + off}px, ${y(tr)}px)`, transitionDuration: `${ms}ms` }}
                  >
                    <circle r={multi ? 7 : 9} fill={PATH_COLOR} stroke="#fff" strokeWidth={2} />
                    <text
                      y={multi ? -10 - (i % 2) * 11 : -14}
                      textAnchor="middle"
                      fontSize={multi ? 10 : 12}
                      fontWeight={600}
                      fill="#111827"
                      className="ladder-marker-label"
                    >
                      {multi ? players[i].slice(0, 4) : players[i]}
                    </text>
                  </g>
                </g>
              )
            })}
          </svg>
          <div className="ladder-labels">
            {prizes.map((p, c) => {
              const who = shown.find((i) => results[i].end === c)
              return (
                <span key={c} style={{ left: x(c) }}>
                  {/* 당첨·꽝은 처음부터 공개. 도착하면 진하게 + 이름 표시 */}
                  <span
                    className={`badge ${p ? 'hit' : 'miss'}${who == null ? ' ladder-pending' : ''}${who === last ? ' ladder-reveal' : ''}`}
                  >
                    {p ? '당첨' : '꽝'}
                  </span>
                </span>
              )
            })}
          </div>
        </div>
      </div>
      {shown.length < n && (
        <div className="ladder-actions">
          <button className="primary big" onClick={startAll} disabled={running}>
            전체 출발
          </button>
          <button className="big" onClick={showAll} disabled={running}>
            전체 결과 보기
          </button>
        </div>
      )}
    </div>
  )
}
