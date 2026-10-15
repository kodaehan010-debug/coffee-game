import { useState } from 'react'
import { randInt } from '../lib/draw'
import { narrow } from '../lib/rules'
import { beep, boom } from '../lib/sound'
import type { GameProps } from './registry'

const MAX = 100
const newSecret = () => 1 + randInt(MAX)

// 비밀 숫자(1~100)를 차례로 추측. 정답을 맞힌 사람이 당첨(폭탄 숫자)
export default function UpDown({ players, winners, sound, onFinish }: GameProps) {
  const [pool, setPool] = useState(players)
  const [won, setWon] = useState<string[]>([])
  const [secret, setSecret] = useState(newSecret)
  const [range, setRange] = useState<[number, number]>([1, MAX])
  const [turn, setTurn] = useState(0)
  const [guess, setGuess] = useState('')
  const [hint, setHint] = useState('')

  const player = pool[turn % pool.length]
  const g = Number(guess)
  const valid = Number.isInteger(g) && g >= range[0] && g <= range[1]

  const submit = () => {
    if (!valid) return
    setGuess('')
    const r = narrow(range, secret, g)
    if (!r.hit) {
      beep(g < secret ? 700 : 400, 100, sound)
      setHint(`${player}: ${g} → ${g < secret ? 'UP' : 'DOWN'}`)
      setRange(r.range)
      setTurn(turn + 1)
      return
    }
    boom(sound)
    const all = [...won, player]
    setHint(`${player}: ${g} → 정답! 당첨`)
    if (all.length >= winners) return setTimeout(() => onFinish(all), 1200)
    // 다음 라운드: 당첨자 제외, 새 숫자
    setWon(all)
    setPool(pool.filter((p) => p !== player))
    setSecret(newSecret())
    setRange([1, MAX])
    setTurn(0)
  }

  return (
    <div>
      {won.length > 0 && <p className="muted">당첨: {won.join(', ')}</p>}
      <p className="big-text">
        {range[0]} ~ {range[1]}
      </p>
      <p>
        <strong>{player}</strong> 님 차례 · 정답을 맞히면 당첨
      </p>
      <div className="row center">
        <input
          aria-label="추측 숫자"
          type="number"
          inputMode="numeric"
          value={guess}
          min={range[0]}
          max={range[1]}
          placeholder={`${range[0]}~${range[1]}`}
          onChange={(e) => setGuess(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && submit()}
          autoFocus
        />
        <button className="primary" onClick={submit} disabled={!valid}>
          확인
        </button>
      </div>
      {guess && !valid && <p className="error-text">{range[0]}~{range[1]} 사이 숫자를 입력하세요.</p>}
      {hint && <p className="big-text">{hint}</p>}
    </div>
  )
}
