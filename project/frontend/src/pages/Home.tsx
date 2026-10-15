import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppState } from '../AppState'
import { MAX_PLAYERS, MAX_WINNERS, normalizeNames } from '../lib/draw'
import { displayName, rosterStore, teamsOf, type Favorite } from '../lib/roster'
import { matches, setMany, toggle } from '../lib/selection'

const ALL = '전체'

export default function Home() {
  const { players, setPlayers, settings, setSettings } = useAppState()
  const navigate = useNavigate()
  const [roster] = useState(rosterStore.load)
  const [tab, setTab] = useState(ALL)
  const [q, setQ] = useState('')
  const [manual, setManual] = useState('')
  const [favs, setFavs] = useState<Favorite[]>(rosterStore.loadFavorites)
  const [favId, setFavId] = useState('')
  const [favName, setFavName] = useState('')

  const teams = useMemo(() => teamsOf(roster), [roster])
  const members = useMemo(() => roster.map((m) => ({ ...m, label: displayName(m, roster) })), [roster])
  const visible = members.filter((m) => (tab === ALL || m.team === tab) && (!q.trim() || matches(m.name, q)))
  const count = (t: string) => (t === ALL ? members.length : members.filter((m) => m.team === t).length)

  const full = players.length >= MAX_PLAYERS
  const allOn = visible.length > 0 && visible.every((m) => players.includes(m.label))
  const canStart = players.length >= 2

  const addManual = () => {
    setPlayers(normalizeNames([...players, ...manual.split(/[,\n]/)]))
    setManual('')
  }
  const saveFavs = (f: Favorite[]) => { setFavs(f); rosterStore.saveFavorites(f) }
  const saveFav = () => {
    const name = favName.trim()
    if (!name || players.length === 0) return
    saveFavs([...favs.filter((f) => f.name !== name), { id: String(Date.now()), name, players }])
    setFavName('')
  }
  const fav = favs.find((f) => f.id === favId)

  return (
    <section className="home">
      <h2>참가자 선택</h2>
      <div className="home-grid">
        {/* 왼쪽: 명단 */}
        <div className="panel">
          <h3>명단</h3>
          {roster.length === 0 ? (
            <div className="empty">
              명단이 없습니다. 설정 → 명단 관리에서 구성원을 추가하세요.
              <div><a href="#/settings/roster">명단 관리로 이동</a></div>
            </div>
          ) : (
            <>
              <div className="tabs" role="tablist" aria-label="팀 선택">
                {[ALL, ...teams].map((t) => (
                  <button key={t} role="tab" aria-selected={tab === t} className={tab === t ? 'on' : ''} onClick={() => setTab(t)}>
                    {t} <span className="tnum muted">{count(t)}</span>
                  </button>
                ))}
              </div>
              <div className="field">
                <label htmlFor="search">이름 검색</label>
                <input id="search" value={q} placeholder="이름 일부 입력" onChange={(e) => setQ(e.target.value)} />
              </div>
              <div className="panel-bar">
                <button
                  className="link"
                  disabled={visible.length === 0 || (!allOn && full)}
                  onClick={() => setPlayers(setMany(players, visible.map((m) => m.label), !allOn))}
                >
                  {allOn ? '이 탭 전체 해제' : '이 탭 전체 선택'}
                </button>
                {full && <span className="notice">최대 {MAX_PLAYERS}명까지 선택할 수 있습니다.</span>}
              </div>
              <div className="member-grid">
                {visible.map((m) => {
                  const on = players.includes(m.label)
                  return (
                    <label key={m.team + '\u0000' + m.name} className="check">
                      <input
                        type="checkbox"
                        checked={on}
                        disabled={!on && full}
                        onChange={(e) => setPlayers(toggle(players, m.label, e.target.checked))}
                      />
                      <span>{m.name}{tab === ALL && <span className="muted"> · {m.team}</span>}</span>
                    </label>
                  )
                })}
                {visible.length === 0 && <p className="muted">검색 결과가 없습니다.</p>}
              </div>
            </>
          )}
          <div className="row">
            <div className="field">
              <label htmlFor="manual">이름 직접 추가 (쉼표로 여러 명)</label>
              <input
                id="manual"
                value={manual}
                placeholder="예: 김가나, 이다라"
                disabled={full}
                onChange={(e) => setManual(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.nativeEvent.isComposing && addManual()}
              />
            </div>
            <button onClick={addManual} disabled={full || !manual.trim()}>추가</button>
          </div>
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
                    {p}
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

          <span className="label">즐겨찾기</span>
          <div className="row">
            <div className="field">
              <label htmlFor="fav">저장된 목록</label>
              <select id="fav" value={favId} onChange={(e) => setFavId(e.target.value)}>
                <option value="">선택하세요</option>
                {favs.map((f) => (
                  <option key={f.id} value={f.id}>{f.name} ({f.players.length}명)</option>
                ))}
              </select>
            </div>
            <button disabled={!fav} onClick={() => fav && setPlayers(normalizeNames(fav.players))}>불러오기</button>
            <button className="danger" disabled={!fav} onClick={() => { saveFavs(favs.filter((f) => f.id !== favId)); setFavId('') }}>삭제</button>
          </div>
          {fav && <p className="muted">불러오면 현재 선택이 이 목록으로 바뀝니다.</p>}
          <div className="row">
            <div className="field">
              <label htmlFor="favname">현재 목록 저장</label>
              <input id="favname" value={favName} placeholder="예: 우리 팀 점심" onChange={(e) => setFavName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.nativeEvent.isComposing && saveFav()} />
            </div>
            <button disabled={!favName.trim() || players.length === 0} onClick={saveFav}>저장</button>
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
