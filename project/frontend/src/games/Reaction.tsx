import { useEffect, useRef, useState } from 'react'
import { randInt } from '../lib/draw'
import { slowest } from '../lib/rules'
import { beep } from '../lib/sound'
import type { GameProps } from './registry'

type Phase = 'idle' | 'wait' | 'go' | 'done'

// 순서대로 한 명씩: 신호 후 클릭. 가장 느린 사람 당첨. 신호 전 클릭 = 부정출발(최하위)
export default function Reaction({ players, winners, sound, onFinish }: GameProps) {
  const [times, setTimes] = useState<Record<string, number>>({})
  const [phase, _setPhase] = useState<Phase>('idle')
  const phaseRef = useRef<Phase>('idle') // 빠른 연속 클릭 시 최신 단계 보장
  const setPhase = (p: Phase) => {
    phaseRef.current = p
    _setPhase(p)
  }
  const goAt = useRef(0)
  const timer = useRef<number>(0)
  const idx = Object.keys(times).length
  const player = players[idx]

  useEffect(() => () => clearTimeout(timer.current), [])

  const record = (ms: number) => {
    const next = { ...times, [player]: ms }
    setTimes(next)
    setPhase('done')
    if (Object.keys(next).length === players.length) setTimeout(() => onFinish(slowest(next, winners)), 1200)
  }

  const press = () => {
    const phase = phaseRef.current
    if (phase === 'idle' || phase === 'done') {
      if (!player) return
      setPhase('wait')
      clearTimeout(timer.current)
      timer.current = window.setTimeout(() => {
        goAt.current = performance.now()
        setPhase('go')
        beep(1000, 100, sound)
      }, 1500 + randInt(2500))
    } else if (phase === 'wait') {
      clearTimeout(timer.current)
      beep(200, 200, sound)
      record(Infinity)
    } else {
      record(Math.round(performance.now() - goAt.current))
    }
  }

  const last = idx > 0 ? times[players[idx - 1]] : null
  const label = {
    idle: `${player} 님, 누르면 시작`,
    wait: '기다리세요…',
    go: '지금 누르세요!',
    done: player ? `다음: ${player} 님 (누르면 시작)` : '집계 중…',
  }[phase]

  return (
    <div>
      <button className={`reaction ${phase}`} onClick={press}>
        {label}
      </button>
      {phase === 'done' && last != null && (
        <p className="big-text">{last === Infinity ? '부정출발!' : `${last.toLocaleString()} ms`}</p>
      )}
      <ol className="legend">
        {Object.entries(times).map(([n, t]) => (
          <li key={n}>
            {n}: {t === Infinity ? '부정출발' : `${t} ms`}
          </li>
        ))}
      </ol>
    </div>
  )
}
