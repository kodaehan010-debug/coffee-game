import { useState } from 'react'
import { Link } from 'react-router-dom'
import { readSheet } from 'read-excel-file/browser'
import { parseRoster, rosterStore, teamsOf, type Member } from '../lib/roster'
import { addMember, filterRoster, removeMember } from '../lib/rosterEdit'

const NEW = '__new__'

// 명단 관리: 팀 필터·검색·추가·삭제·기본값 복원·엑셀 교체
export default function Roster() {
  const [roster, setRoster] = useState(rosterStore.load)
  const [tab, setTab] = useState('')
  const [q, setQ] = useState('')
  const [team, setTeam] = useState('')
  const [newTeam, setNewTeam] = useState('')
  const [name, setName] = useState('')
  const [msg, setMsg] = useState('')

  const teams = teamsOf(roster)
  const rows = filterRoster(roster, tab, q)
  const commit = (r: Member[]) => { setRoster(r); rosterStore.save(r) }
  const isNew = team === NEW || !teams.length

  const add = () => {
    const r = addMember(roster, isNew ? newTeam : team, name)
    if (typeof r === 'string') return setMsg(r)
    commit(r); setName(''); setMsg('추가했습니다.')
  }
  const del = (m: Member) => {
    if (confirm(`${m.team} ${m.name} 님을 삭제할까요?`)) commit(removeMember(roster, m))
  }
  const reset = () => {
    if (!confirm('추가·삭제한 내용을 모두 지우고 기본 명단으로 되돌릴까요?')) return
    rosterStore.reset(); setRoster(rosterStore.load()); setTab(''); setMsg('기본 명단으로 되돌렸습니다.')
  }
  const upload = async (file?: File) => {
    if (!file) return
    try {
      const r = parseRoster(await readSheet(file))
      if (!r.length) throw new Error()
      if (!confirm(`${teamsOf(r).length}개 팀, ${r.length}명으로 명단을 바꿀까요?`)) return
      commit(r); setTab(''); setMsg(`${teamsOf(r).length}개 팀, ${r.length}명 불러옴`)
    } catch {
      setMsg('엑셀을 읽지 못했습니다. 형식을 확인해 주세요.')
    }
  }

  return (
    <section className="roster-manage">
      <p><Link to="/settings">설정으로 돌아가기</Link></p>
      <h2>명단 관리</h2>
      <p className="muted">
        이 브라우저에만 저장됩니다. 현재 <span className="tnum">{teams.length}</span>개 팀,{' '}
        <span className="tnum">{roster.length}</span>명
      </p>

      <div className="rm-tabs" role="tablist" aria-label="팀 필터">
        {['', ...teams].map((t) => (
          <button key={t || 'all'} role="tab" aria-selected={tab === t} className={tab === t ? 'on' : ''} onClick={() => setTab(t)}>
            {t || '전체'}
          </button>
        ))}
      </div>

      <div className="field">
        <label htmlFor="rm-q">검색</label>
        <input id="rm-q" value={q} placeholder="이름 또는 팀" onChange={(e) => setQ(e.target.value)} />
      </div>

      <p className="muted">표시 <span className="tnum">{rows.length}</span>명</p>
      {rows.length ? (
        <div className="table-wrap">
          <table className="rm-table">
            <thead><tr><th>팀</th><th>이름</th><th>삭제</th></tr></thead>
            <tbody>
              {rows.map((m) => (
                <tr key={m.team + '|' + m.name}>
                  <td>{m.team}</td>
                  <td>{m.name}</td>
                  <td><button onClick={() => del(m)} aria-label={`${m.name} 삭제`}>삭제</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="empty">
          {roster.length ? '조건에 맞는 사람이 없습니다.' : '명단이 비어 있습니다. 아래에서 추가하거나 엑셀로 불러오세요.'}
        </p>
      )}

      <h3>사람 추가</h3>
      <div className="row">
        {teams.length > 0 && (
          <div className="field">
            <label htmlFor="rm-team">팀</label>
            <select id="rm-team" value={team} onChange={(e) => setTeam(e.target.value)}>
              <option value="">팀 선택</option>
              {teams.map((t) => <option key={t} value={t}>{t}</option>)}
              <option value={NEW}>새 팀</option>
            </select>
          </div>
        )}
        {isNew && (
          <div className="field">
            <label htmlFor="rm-newteam">새 팀 이름</label>
            <input id="rm-newteam" value={newTeam} onChange={(e) => setNewTeam(e.target.value)} />
          </div>
        )}
        <div className="field">
          <label htmlFor="rm-name">이름</label>
          <input id="rm-name" value={name} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') add() }} />
        </div>
        <button className="primary" onClick={add}>추가</button>
      </div>
      {msg && <p className="muted" role="status">{msg}</p>}

      <h3>명단 바꾸기</h3>
      <div className="field">
        <label htmlFor="rm-xlsx">엑셀로 명단 바꾸기 (.xlsx, 1행 머리글: 팀 / 이름)</label>
        <input id="rm-xlsx" type="file" accept=".xlsx" onChange={(e) => { upload(e.target.files?.[0]); e.target.value = '' }} />
      </div>
      <div className="row">
        <button onClick={reset}>기본 명단으로 되돌리기</button>
      </div>
    </section>
  )
}
