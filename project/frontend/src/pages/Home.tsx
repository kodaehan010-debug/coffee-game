import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppState } from '../AppState'
import { MAX_PLAYERS, MAX_WINNERS, normalizeNames } from '../lib/draw'

export default function Home() {
  const { players, setPlayers, settings, setSettings } = useAppState()
  const [input, setInput] = useState('')
  const navigate = useNavigate()

  // 쉼표·줄바꿈으로 여러 명 한 번에 입력
  const add = () => {
    setPlayers(normalizeNames([...players, ...input.split(/[,\n]/)]))
    setInput('')
  }
  const remove = (n: string) => setPlayers(players.filter((p) => p !== n))
  const full = players.length >= MAX_PLAYERS

  return (
    <section>
      <h2>참가자 입력</h2>
      <div className="row">
        <div className="field">
        <label htmlFor="name">이름 (쉼표로 여러 명 한 번에)</label>
        <input
          id="name"
          value={input}
          placeholder="예: 김가나, 이다라"
          disabled={full}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !e.nativeEvent.isComposing && add()}
        />
        </div>
        <button onClick={add} disabled={full || !input.trim()}>
          추가
        </button>
      </div>
      <p className="muted">
        <span className="tnum">{players.length} / {MAX_PLAYERS} 명</span> {full && '· 최대 인원 도달'}
      </p>

      <ul className="chips">
        {players.map((p) => (
          <li key={p}>
            {p} <button className="x" onClick={() => remove(p)} aria-label={`${p} 삭제`}>×</button>
          </li>
        ))}
      </ul>
      {players.length > 0 && (
        <button className="link" onClick={() => setPlayers([])}>
          전체 삭제
        </button>
      )}

      <h3>당첨 인원</h3>
      <div className="row center">
        {Array.from({ length: MAX_WINNERS }, (_, i) => i + 1).map((n) => (
          <button
            key={n}
            className={settings.winners === n ? 'on' : ''}
            onClick={() => setSettings({ ...settings, winners: n })}
          >
            {n}명
          </button>
        ))}
      </div>

      <button className="primary big" disabled={players.length < 2} onClick={() => navigate('/games')}>
        게임 고르기
      </button>
      {players.length < 2 && <p className="muted">2명 이상 입력해 주세요.</p>}
    </section>
  )
}
