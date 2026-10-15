// 조추첨 ③ 추첨 시작: 설정 요약 → 추첨 → 결과 공개
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { memberOf, rosterStore, shortLabel } from '../../lib/roster'
import XlsxDownload from '../../components/XlsxDownload'
import { drawTeams, previewText, resultText, type DrawResult } from '../../lib/teamDraw'
import { fmtDate, tdHistory } from '../../lib/teamDrawStore'
import { derive, useDrawState } from './drawState'
import TeamBoard from './TeamBoard'

const STEP_MS = 120 // 1명 공개 간격 (전체 최대 약 4초로 자동 단축)
const reduced = () => typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches

export default function DrawRun() {
  const [s] = useDrawState()
  const { n, tpg, total, labelList, validSeeds, validFixed, validApart, error } = derive(s)
  const [result, setResult] = useState<DrawResult | null>(null)
  const [drawnAt, setDrawnAt] = useState('')
  const [shown, setShown] = useState(0)
  const [msg, setMsg] = useState('')

  const roster = useMemo(() => rosterStore.load(), [])
  const dept = useMemo(() => {
    // 원래 키와 짧은 표시 이름 둘 다로 소속 조회
    const label = shortLabel(s.selected)
    const m = new Map(s.selected.flatMap((x) => { const t = memberOf(x, roster)?.team; return [[x, t], [label(x), t]] as const }))
    return (x: string) => m.get(x)
  }, [s.selected, roster])

  // 공개 애니메이션: 자리 순서대로 1명씩 (모션 줄이기 설정이면 즉시)
  useEffect(() => {
    if (!result) return
    const people = result.groups.flatMap((g) => g.teams).reduce((a, t) => a + t.members.length, 0)
    if (reduced()) { setShown(Infinity); return }
    setShown(0)
    const id = setInterval(() => setShown((v) => { if (v >= people) { clearInterval(id); return v } return v + 1 }), Math.min(STEP_MS, 4000 / people))
    return () => clearInterval(id)
  }, [result])

  const seedCount = !s.useSeeds ? 0 : s.randomSeeds ? total : Math.min(total, validSeeds.length)
  const start = () => {
    // 조장 랜덤 지정: drawTeams 가 추첨 때마다 팀마다 1명 새로 뽑음 (강제 지정 팀은 그 팀 지정 인원 중)
    let r = drawTeams(s.selected.map((name) => ({ name, dept: dept(name) })), { groups: s.groups, teamsPerGroup: tpg, labels: labelList },
      { spread: s.spread, seeds: s.useSeeds && !s.randomSeeds ? validSeeds : [], randomSeeds: s.useSeeds && s.randomSeeds, fixed: validFixed, apart: validApart })
    // 결과 표시는 짧은 이름: 선택 명단에 동명이인이 없으면 "이름(팀)" → "이름"
    const label = shortLabel(s.selected)
    r = { ...r, groups: r.groups.map((g) => ({ ...g, teams: g.teams.map((t) => ({ ...t, members: t.members.map(label) })) })), seeds: r.seeds?.map(label) }
    const seeds = r.seeds ?? []
    const date = new Date().toISOString()
    setResult(r)
    setDrawnAt(date)
    setMsg('')
    tdHistory.add({
      id: crypto.randomUUID?.() ?? String(Date.now()), date, count: n,
      config: { groups: s.groups, teamsPerGroup: tpg, labels: labelList, spread: s.spread, seeds: seeds.length },
      result: r, depts: Object.fromEntries(s.selected.map((x) => [shortLabel(s.selected)(x), dept(x) ?? ''])),
    })
  }

  const copy = async () => {
    try { await navigator.clipboard.writeText(resultText(result!, dept)); setMsg('결과를 복사했습니다.') } catch { setMsg('복사에 실패했습니다.') }
  }

  if (result) {
    return (
      <section className="td">
        <h2>조추첨 결과</h2>
        <p className="muted tnum">{fmtDate(drawnAt)} · {n}명 · {s.groups}개 조 × {tpg}팀 · {previewText(n, total)}</p>
        {shown < n && <button className="link td-skip" onClick={() => setShown(Infinity)}>바로 보기</button>}
        {result.warnings?.map((w) => <p key={w} className="error-text" role="alert">{w}</p>)}
        <TeamBoard result={result} dept={dept} shown={shown} />
        <div className="row center td-actions">
          <button className="primary" onClick={copy}>결과 복사</button>
          <XlsxDownload result={result} date={drawnAt} dept={dept} />
          <button onClick={() => print()}>인쇄</button>
          <button onClick={() => { if (confirm('다시 추첨할까요? 현재 결과는 기록에 남습니다.')) start() }}>다시 추첨</button>
          <button onClick={() => setResult(null)}>요약으로</button>
        </div>
        {msg && <p className="muted" role="status">{msg}</p>}
      </section>
    )
  }

  return (
    <section className="td">
      <h2>추첨 시작</h2>
      <table className="td-summary">
        <tbody>
          <tr><th>참가자</th><td className="tnum">{n}명 · <Link to="/draw">변경</Link></td></tr>
          <tr><th>구성</th><td className="tnum">{s.groups}개 조 × {tpg}팀 = 총 {total}팀 ({labelList[0]}1 ~ {labelList[s.groups - 1]}{tpg})</td></tr>
          <tr><th>팀 인원</th><td className="tnum">{n ? previewText(n, total) : '-'}</td></tr>
          <tr><th>소속 분산</th><td>{s.spread ? '사용' : '사용 안 함'}</td></tr>
          <tr><th>강제 지정</th><td className="tnum">{Object.keys(validFixed).length ? `${Object.keys(validFixed).length}명` : '없음'}</td></tr>
          <tr><th>같은 팀 금지</th><td className="tnum">{validApart.length ? `${validApart.length}개 그룹 (${validApart.reduce((a, g) => a + g.length, 0)}명)` : '없음'}</td></tr>
          <tr><th>조장</th><td className="tnum">{seedCount ? `${seedCount}명${s.randomSeeds ? ' (추첨 시 팀마다 랜덤 · 강제 지정 팀은 지정 인원 중)' : ''}` : '없음'} · <Link to="/draw/setup">설정 변경</Link></td></tr>
        </tbody>
      </table>
      {error && <p className="error-text">{error}</p>}
      <button className="primary big" disabled={!!error} onClick={start}>추첨 시작</button>
    </section>
  )
}
