import { useState } from 'react'
import { makeLadder, makePrizes, tracePath } from '../lib/ladder'
import { beep } from '../lib/sound'
import type { GameProps } from './registry'

const COL_W = 64
const ROW_H = 28
const PAD = 36
const COLORS = ['#e4572e', '#29335c', '#17bebb', '#ffc914', '#76b041', '#8e44ad']

export default function Ladder({ players, winners, sound, onFinish }: GameProps) {
  const n = players.length
  const [ladder] = useState(() => makeLadder(n))
  const [prizes] = useState(() => makePrizes(n, winners))
  const [shown, setShown] = useState<number[]>([])

  const w = PAD * 2 + COL_W * (n - 1)
  const h = ROW_H * (ladder.rows + 1)
  const x = (c: number) => PAD + c * COL_W
  const y = (r: number) => ROW_H * (r + 0.5)

  const results = players.map((_, i) => tracePath(ladder, i))

  const show = (i: number) => {
    if (shown.includes(i)) return
    const next = [...shown, i]
    setShown(next)
    beep(prizes[results[i].end] ? 880 : 520, 120, sound)
    if (next.length === n) finish()
  }

  const finish = () =>
    setTimeout(() => onFinish(players.filter((_, i) => prizes[results[i].end])), 1500)

  const showAll = () => {
    setShown(players.map((_, i) => i))
    finish()
  }

  // 경로 polyline: 각 row 에서 세로 이동 후 가로 이동
  const points = (i: number) => {
    const { path } = results[i]
    const pts: string[] = [`${x(path[0])},0`]
    for (let r = 0; r < ladder.rows; r++) {
      pts.push(`${x(path[r])},${y(r)}`, `${x(path[r + 1])},${y(r)}`)
    }
    pts.push(`${x(path[ladder.rows])},${h}`)
    return pts.join(' ')
  }

  return (
    <div>
      <p className="muted">이름을 눌러 결과 확인</p>
      <div className="table-wrap">
        <div style={{ width: w, margin: '0 auto' }}>
          <div className="ladder-labels">
            {players.map((p, i) => (
              <button key={p} style={{ left: x(i) }} className={shown.includes(i) ? 'on' : ''} onClick={() => show(i)}>
                {p}
              </button>
            ))}
          </div>
          <svg width={w} height={h}>
            {players.map((_, c) => (
              <line key={c} x1={x(c)} y1={0} x2={x(c)} y2={h} stroke="#999" strokeWidth={3} />
            ))}
            {ladder.rungs.map((row, r) =>
              row.map((c) => (
                <line key={`${r}-${c}`} x1={x(c)} y1={y(r)} x2={x(c + 1)} y2={y(r)} stroke="#999" strokeWidth={3} />
              )),
            )}
            {shown.map((i) => (
              <polyline
                key={i}
                className="ladder-path"
                points={points(i)}
                fill="none"
                stroke={COLORS[i % COLORS.length]}
                strokeWidth={5}
              />
            ))}
          </svg>
          <div className="ladder-labels">
            {prizes.map((p, c) => {
              const who = shown.find((i) => results[i].end === c)
              return (
                <span key={c} style={{ left: x(c) }} className={who != null ? (p ? 'win' : 'on') : ''}>
                  {who != null ? (p ? '☕' : '꽝') : '?'}
                </span>
              )
            })}
          </div>
        </div>
      </div>
      {shown.length < n && (
        <button className="primary big" onClick={showAll}>
          전체 결과 보기
        </button>
      )}
    </div>
  )
}
