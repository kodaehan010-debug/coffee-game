// 명단 선택 UI (팀 탭 + 검색 + 체크 그리드 + 직접 추가). 커피 게임·조추첨 공용
import { useMemo, useState } from 'react'
import { displayName, rosterStore, teamsOf } from '../lib/roster'
import { matches, setMany, toggle } from '../lib/selection'

const ALL = '전체'

export default function RosterPicker({ selected, onChange, max = Infinity, rosterLink = '/settings/roster' }: {
  selected: string[]
  onChange: (next: string[]) => void
  max?: number
  rosterLink?: string
}) {
  const [roster] = useState(rosterStore.load)
  const [tab, setTab] = useState(ALL)
  const [q, setQ] = useState('')
  const [manual, setManual] = useState('')

  const teams = useMemo(() => teamsOf(roster), [roster])
  const members = useMemo(() => roster.map((m) => ({ ...m, label: displayName(m, roster) })), [roster])
  const visible = members.filter((m) => (tab === ALL || m.team === tab) && (!q.trim() || matches(m.name, q)))
  const count = (t: string) => (t === ALL ? members.length : members.filter((m) => m.team === t).length)

  const full = selected.length >= max
  const allOn = visible.length > 0 && visible.every((m) => selected.includes(m.label))

  const addManual = () => {
    const out = [...selected]
    for (const raw of manual.split(/[,\n]/)) {
      const n = raw.trim()
      if (n && !out.includes(n) && out.length < max) out.push(n)
    }
    onChange(out)
    setManual('')
  }

  return (
    <>
      {roster.length === 0 ? (
        <div className="empty">
          명단이 없습니다. 설정 → 명단 관리에서 구성원을 추가하세요.
          <div><a href={'#' + rosterLink}>명단 관리로 이동</a></div>
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
              onClick={() => onChange(setMany(selected, visible.map((m) => m.label), !allOn, max))}
            >
              {allOn ? '이 탭 전체 해제' : '이 탭 전체 선택'}
            </button>
            {full && Number.isFinite(max) && <span className="notice">최대 {max}명까지 선택할 수 있습니다.</span>}
          </div>
          <div className="member-grid">
            {visible.map((m) => {
              const on = selected.includes(m.label)
              return (
                <label key={m.team + '\u0000' + m.name} className="check">
                  <input
                    type="checkbox"
                    checked={on}
                    disabled={!on && full}
                    onChange={(e) => onChange(toggle(selected, m.label, e.target.checked, max))}
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
    </>
  )
}
