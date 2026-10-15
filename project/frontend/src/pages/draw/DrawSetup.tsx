// 조추첨 ② 추첨 설정: 조 수, 나누는 기준, 조 이름, 소속 분산, 조장
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { previewText } from '../../lib/teamDraw'
import Icon from '../../components/Icon'
import { shortLabel } from '../../lib/roster'
import { derive, useDrawState } from './drawState'

export default function DrawSetup() {
  const [s, update] = useDrawState()
  const navigate = useNavigate()
  const { n, tpg, total, labelList, validSeeds, teamIds, validFixed, error } = derive(s)
  const [fixTeam, setFixTeam] = useState('')
  const [fixQ, setFixQ] = useState('')
  // 표시 이름: 선택 명단에 동명이인이 없으면 이름만
  const lb = shortLabel(s.selected)
  const [seedQ, setSeedQ] = useState('')
  const [apartQ, setApartQ] = useState('')
  const [apartSel, setApartSel] = useState<string[]>([])
  // 이름 검색 (공백 무시)
  const norm = (v: string) => v.replace(/\s/g, '').toLowerCase()
  const filter = (q: string) => s.selected.filter((x) => norm(x).includes(norm(q)))

  const team = teamIds.includes(fixTeam) ? fixTeam : teamIds[0]
  const toggleFix = (x: string) => {
    const f = { ...s.fixed }
    if (f[x] === team) delete f[x]
    else f[x] = team
    update({ fixed: f })
  }
  const fixedBy = (id: string) => Object.keys(validFixed).filter((x) => validFixed[x] === id)
  const maxSize = n && total ? Math.ceil(n / total) : 0

  return (
    <section className="td">
      <h2>추첨 설정</h2>
      <p className="muted tnum">참가자 {n}명 · <Link to="/draw">명단 변경</Link></p>
      <div className="td-step">
        <div className="row">
          <div className="field">
            <label htmlFor="td-groups">조 수</label>
            <input id="td-groups" type="number" min={1} max={26} value={s.groups}
              onChange={(e) => update({ groups: Math.max(1, Math.min(26, Number(e.target.value) || 1)) })} />
          </div>
          <div className="field">
            <span className="label">나누는 기준</span>
            <div className="td-seg">
              <button className={s.mode === 'teams' ? 'on' : ''} aria-pressed={s.mode === 'teams'} onClick={() => update({ mode: 'teams' })}>조별 팀 수</button>
              <button className={s.mode === 'size' ? 'on' : ''} aria-pressed={s.mode === 'size'} onClick={() => update({ mode: 'size' })}>팀당 인원</button>
            </div>
          </div>
          {s.mode === 'teams' ? (
            <div className="field">
              <label htmlFor="td-tpg">조별 팀 수</label>
              <input id="td-tpg" type="number" min={1} value={s.teamsPerGroup}
                onChange={(e) => update({ teamsPerGroup: Math.max(1, Number(e.target.value) || 1) })} />
            </div>
          ) : (
            <div className="field">
              <label htmlFor="td-size">팀당 인원 (목표)</label>
              <input id="td-size" type="number" min={1} value={s.size}
                onChange={(e) => update({ size: Math.max(1, Number(e.target.value) || 1) })} />
            </div>
          )}
        </div>
        <div className="row">
          {labelList.map((l, i) => (
            <div className="field td-label" key={i}>
              <label htmlFor={`td-l${i}`}>{i + 1}번째 조 이름</label>
              <input id={`td-l${i}`} value={s.labels[i] ?? ''} placeholder={l} maxLength={6}
                onChange={(e) => { const a = [...s.labels]; a[i] = e.target.value; update({ labels: a }) }} />
            </div>
          ))}
        </div>
        <p className="td-preview tnum">
          총 <strong>{total}팀</strong> ({labelList[0]}1 ~ {labelList[s.groups - 1]}{tpg}) · 팀 구성 <strong>{n ? previewText(n, total) : '-'}</strong>
        </p>
        <label className="td-check">
          <input type="checkbox" checked={s.spread} onChange={(e) => update({ spread: e.target.checked })} />
          <span><strong>소속 분산</strong> (추천) — 같은 소속끼리 한 팀에 몰리지 않게 섞기</span>
        </label>
        <label className="td-check">
          <input type="checkbox" checked={s.useSeeds} onChange={(e) => update({ useSeeds: e.target.checked })} />
          <span><strong>조장 지정</strong> — 지정한 사람을 팀마다 1명씩 먼저 배치</span>
        </label>
        {s.useSeeds && (
          <div className="td-seeds">
            <div className="row td-tools">
              {!s.randomSeeds && <p className="muted tnum">조장 {validSeeds.length}명 / 최대 {total}명</p>}
              <button className={s.randomSeeds ? 'on' : ''} aria-pressed={s.randomSeeds} onClick={() => update({ randomSeeds: !s.randomSeeds })}>
                <Icon name="shuffle" size={16} /> 조장 랜덤 지정 {s.randomSeeds ? '켜짐' : '꺼짐'}
              </button>
              {!s.randomSeeds && validSeeds.length > 0 && <button className="link" onClick={() => update({ seeds: [] })}>조장 모두 해제</button>}
            </div>
            {s.randomSeeds && <p className="td-preview tnum">추첨 시작 시 팀마다 조장 1명씩 무작위 지정 (총 {total}명) · 강제 지정 인원이 있는 팀은 그 팀 지정 인원 중에서 선정</p>}
            {!s.randomSeeds && n > 0 && (
              <div className="field">
                <label htmlFor="td-seedq">조장 검색</label>
                <input id="td-seedq" type="search" value={seedQ} placeholder="이름 검색" onChange={(e) => setSeedQ(e.target.value)} />
              </div>
            )}
            {s.randomSeeds ? null : n === 0 ? <p className="muted">먼저 참가자를 선택하세요.</p> : (
              <div className="td-seed-list">
                {filter(seedQ).map((x) => (
                  <button key={x} className={validSeeds.includes(x) ? 'on' : ''} aria-pressed={validSeeds.includes(x)}
                    onClick={() => update({ seeds: s.seeds.includes(x) ? s.seeds.filter((y) => y !== x) : [...s.seeds, x] })}>{lb(x)}</button>
                ))}
              </div>
            )}
          </div>
        )}
        <div className="td-fix">
          <span className="label"><strong>팀 강제 지정</strong> — 특정 인원을 원하는 팀에 미리 배치 (나머지는 추첨)</span>
          <div className="row">
            <div className="field">
              <label htmlFor="td-fixteam">지정할 팀</label>
              <select id="td-fixteam" value={team} onChange={(e) => setFixTeam(e.target.value)}>
                {teamIds.map((id) => <option key={id} value={id}>{id} ({fixedBy(id).length}명 지정)</option>)}
              </select>
            </div>
          </div>
          {n === 0 ? <p className="muted">먼저 참가자를 선택하세요.</p> : (
            <>
              <p className="muted tnum">{team} 팀에 넣을 사람을 누르세요 · {team} 지정 {fixedBy(team).length}명 / 팀 정원 약 {maxSize}명</p>
              {fixedBy(team).length > maxSize && <p className="error-text">팀 정원보다 많이 지정했습니다. 이 팀만 인원이 늘어납니다.</p>}
              <div className="field">
                <label htmlFor="td-fixq">이름 검색</label>
                <input id="td-fixq" type="search" value={fixQ} placeholder="이름 검색" onChange={(e) => setFixQ(e.target.value)} />
              </div>
              {filter(fixQ).length === 0 && <p className="muted">검색 결과가 없습니다.</p>}
              <div className="td-seed-list">
                {filter(fixQ).map((x) => {
                  const at = validFixed[x]
                  return (
                    <button key={x} className={at === team ? 'on' : ''} aria-pressed={at === team} onClick={() => toggleFix(x)}
                      title={at && at !== team ? `${at} 팀에 지정됨 (누르면 ${team}(으)로 이동)` : ''}>
                      {lb(x)}{at && at !== team && <span className="muted"> · {at}</span>}
                    </button>
                  )
                })}
              </div>
            </>
          )}
          {Object.keys(validFixed).length > 0 && (
            <div className="td-fix-sum">
              {teamIds.filter((id) => fixedBy(id).length).map((id) => (
                <p key={id} className="tnum"><strong>{id}</strong> {fixedBy(id).map(lb).join(', ')}</p>
              ))}
              <button className="link" onClick={() => update({ fixed: {} })}>강제 지정 모두 해제</button>
            </div>
          )}
        </div>
        <div className="td-fix td-apart">
          <span className="label"><strong>같은 팀 금지</strong> — 그룹으로 묶은 사람끼리는 서로 다른 팀에 배치</span>
          {n === 0 ? <p className="muted">먼저 참가자를 선택하세요.</p> : (
            <>
              <p className="muted tnum">함께 두지 않을 사람을 2명 이상 누른 뒤 [그룹 추가] · 선택 {apartSel.length}명 / 최대 {total}명</p>
              <div className="field">
                <label htmlFor="td-apartq">이름 검색</label>
                <input id="td-apartq" type="search" value={apartQ} placeholder="이름 검색" onChange={(e) => setApartQ(e.target.value)} />
              </div>
              {filter(apartQ).length === 0 && <p className="muted">검색 결과가 없습니다.</p>}
              <div className="td-seed-list">
                {filter(apartQ).map((x) => (
                  <button key={x} className={apartSel.includes(x) ? 'on' : ''} aria-pressed={apartSel.includes(x)}
                    onClick={() => setApartSel(apartSel.includes(x) ? apartSel.filter((y) => y !== x) : [...apartSel, x])}>{lb(x)}</button>
                ))}
              </div>
              <div className="row td-tools">
                <button className="primary" disabled={apartSel.length < 2} onClick={() => { update({ apart: [...s.apart, apartSel] }); setApartSel([]) }}>그룹 추가</button>
                {apartSel.length > 0 && <button className="link" onClick={() => setApartSel([])}>선택 해제</button>}
              </div>
            </>
          )}
          {s.apart.length > 0 && (
            <div className="td-fix-sum">
              {s.apart.map((g, i) => (
                <p key={i} className="tnum td-apart-item">
                  <strong>그룹 {i + 1}</strong> <span>{g.map(lb).join(', ')}</span>
                  {g.filter((x) => s.selected.includes(x)).length < 2 && <span className="muted"> (참가자 2명 미만 · 미적용)</span>}
                  <button className="link" onClick={() => update({ apart: s.apart.filter((_, j) => j !== i) })}>삭제</button>
                </p>
              ))}
              <button className="link" onClick={() => update({ apart: [] })}>같은 팀 금지 모두 해제</button>
            </div>
          )}
        </div>
      </div>
      {error && <p className="error-text">{error}</p>}
      <button className="primary big" disabled={!!error} onClick={() => navigate('/draw/run')}>다음: 추첨 시작</button>
    </section>
  )
}
