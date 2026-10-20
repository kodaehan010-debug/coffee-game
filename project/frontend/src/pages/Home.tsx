import { useNavigate } from 'react-router-dom'
import { useAppState } from '../AppState'
import RosterPicker from '../components/RosterPicker'
import Favorites from '../components/Favorites'
import { MAX_PLAYERS, MAX_WINNERS } from '../lib/draw'
import { shortLabel } from '../lib/roster'

export default function Home() {
  const { players, setPlayers, settings, setSettings } = useAppState()
  const navigate = useNavigate()
  const canStart = players.length >= 2
  const label = shortLabel(players)

  return (
    <section className="home">
      <h2>참가자 선택</h2>
      <Favorites selected={players} onLoad={setPlayers} max={MAX_PLAYERS} />
      <div className="home-grid">
        {/* 왼쪽: 명단 */}
        <div className="panel">
          <h3>명단</h3>
          <RosterPicker selected={players} onChange={setPlayers} max={MAX_PLAYERS} />
        </div>

        {/* 오른쪽: 선택한 참가자 */}
        <div className="panel">
          <div className="panel-bar">
            <h3>선택한 참가자</h3>
            <span className="tnum count">{players.length} / {MAX_PLAYERS} 명</span>
          </div>
          {players.length === 0 ? (
            <p className="muted">왼쪽 명단에서 참가자를 체크하세요.</p>
          ) : (
            <>
              <ul className="chips">
                {players.map((p) => (
                  <li key={p}>
                    {label(p)}
                    <button className="x" onClick={() => setPlayers(players.filter((x) => x !== p))} aria-label={`${p} 삭제`}>×</button>
                  </li>
                ))}
              </ul>
              <button className="link" onClick={() => setPlayers([])}>전체 비우기</button>
            </>
          )}

          <span className="label">당첨 인원</span>
          <div className="segmented" role="group" aria-label="당첨 인원">
            {Array.from({ length: MAX_WINNERS }, (_, i) => i + 1).map((n) => (
              <button key={n} className={settings.winners === n ? 'on' : ''} aria-pressed={settings.winners === n}
                onClick={() => setSettings({ ...settings, winners: n })}>
                {n}명
              </button>
            ))}
          </div>

          <div className="start-desktop">
            <button className="primary big" disabled={!canStart} onClick={() => navigate('/games')}>게임 고르기</button>
            {!canStart && <p className="muted">2명 이상 선택해 주세요.</p>}
          </div>
        </div>
      </div>

      {/* 모바일 하단 고정 바 */}
      <div className="start-bar">
        <button className="primary" disabled={!canStart} onClick={() => navigate('/games')}>
          <span className="tnum">{players.length}명 선택</span> · 게임 고르기
        </button>
      </div>
    </section>
  )
}
