// 조추첨 결과 보드 (조별 섹션 + 팀 카드). shown: 공개된 인원 수 (애니메이션용)
import type { DrawResult } from '../../lib/teamDraw'

export default function TeamBoard({ result, dept, shown = Infinity }: {
  result: DrawResult; dept: (n: string) => string | undefined; shown?: number
}) {
  // 공개 순서: 라운드별(1번째 자리 전 팀 → 2번째 자리 …)
  const teams = result.groups.flatMap((g) => g.teams)
  const order = new Map<string, number>()
  let k = 0
  for (let slot = 0; slot < Math.max(0, ...teams.map((t) => t.members.length)); slot++)
    for (const t of teams) if (t.members[slot]) order.set(t.id + '#' + slot, k++)

  return (
    <div className="td-board">
      {result.groups.map((g) => (
        <section key={g.label} className="td-group">
          <h3>{g.label}조</h3>
          <div className="td-teams">
            {g.teams.map((t) => (
              <article key={t.id} className="td-team">
                <header><strong>{t.id}</strong><span className="muted tnum">{t.members.length}명</span></header>
                <ol>
                  {t.members.map((m, i) => (
                    <li key={m} className={(order.get(t.id + '#' + i) ?? 0) < shown ? 'in' : 'wait'}>
                      <span>{m}</span>{result.seeds?.includes(m) && <span className="badge td-leader">조장</span>}{dept(m) && <small>{dept(m)}</small>}
                    </li>
                  ))}
                </ol>
              </article>
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}
