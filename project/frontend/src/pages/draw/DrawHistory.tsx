// 조추첨 기록: 목록 · 상세 · 삭제
import { useState } from 'react'
import XlsxDownload from '../../components/XlsxDownload'
import { fmtDate, tdHistory, type DrawRecord } from '../../lib/teamDrawStore'
import TeamBoard from './TeamBoard'

const summary = (r: DrawRecord) =>
  `${r.config.groups}개 조 × ${r.config.teamsPerGroup}팀${r.config.spread ? ' · 소속 분산' : ''}${r.config.seeds ? ` · 조장 ${r.config.seeds}명` : ''}`

export default function DrawHistory() {
  const [list, setList] = useState(tdHistory.load)
  const [open, setOpen] = useState<DrawRecord | null>(null)

  const remove = (id: string) => {
    if (!confirm('이 기록을 삭제할까요?')) return
    const next = list.filter((r) => r.id !== id)
    tdHistory.save(next)
    setList(next)
    if (open?.id === id) setOpen(null)
  }

  if (open) {
    const dept = (n: string) => open.depts[n] || undefined
    return (
      <section className="td">
        <h2>조추첨 기록 상세</h2>
        <p className="muted tnum">{fmtDate(open.date)} · {open.count}명 · {summary(open)}</p>
        <TeamBoard result={open.result} dept={dept} />
        <div className="row center td-actions">
          <button className="primary" onClick={() => setOpen(null)}>목록으로</button>
          <XlsxDownload result={open.result} date={open.date} dept={dept} />
          <button onClick={() => print()}>인쇄</button>
          <button className="danger" onClick={() => remove(open.id)}>삭제</button>
        </div>
      </section>
    )
  }

  return (
    <section className="td">
      <h2>조추첨 기록</h2>
      {list.length === 0 ? (
        <p className="empty">아직 기록이 없습니다. 조추첨을 진행하면 여기에 쌓입니다.</p>
      ) : (
        <div className="table-wrap">
          <table className="td-table">
            <thead><tr><th>일시</th><th className="num">인원</th><th>설정</th><th aria-label="작업"></th></tr></thead>
            <tbody>
              {list.map((r) => (
                <tr key={r.id}>
                  <td className="tnum">{fmtDate(r.date)}</td>
                  <td className="num">{r.count}명</td>
                  <td>{summary(r)}</td>
                  <td className="td-row-actions">
                    <button onClick={() => setOpen(r)}>보기</button>
                    <button className="danger" onClick={() => remove(r.id)}>삭제</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
