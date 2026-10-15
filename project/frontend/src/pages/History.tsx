import { useState, type ChangeEvent } from 'react'
import { gameStats, personStats } from '../lib/rules'
import { parseHistory, storage } from '../lib/storage'

export default function History() {
  const [list, setList] = useState(storage.loadHistory)
  const [msg, setMsg] = useState('')

  const exportJson = () => {
    const blob = new Blob([JSON.stringify(list, null, 2)], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `coffee-game-history-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(a.href)
  }

  // 가져오기: 기존 기록과 합침(id 중복 제외)
  const importJson = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    try {
      const incoming = parseHistory(await file.text())
      const ids = new Set(list.map((h) => h.id))
      const merged = [...list, ...incoming.filter((h) => !ids.has(h.id))].sort((a, b) => b.date.localeCompare(a.date))
      storage.saveHistory(merged)
      setList(merged)
      setMsg(`${merged.length - list.length}건을 가져왔습니다.`)
    } catch (err) {
      setMsg(`가져오기 실패: ${(err as Error).message}`)
    }
  }

  const clear = () => {
    if (!confirm('모든 기록을 삭제할까요?')) return
    storage.saveHistory([])
    setList([])
  }

  return (
    <section>
      <h2>기록·통계</h2>
      <div className="row center">
        <button onClick={exportJson} disabled={!list.length}>내보내기</button>
        <label className="btn">
          가져오기
          <input type="file" accept="application/json" hidden onChange={importJson} />
        </label>
        <button className="danger" onClick={clear} disabled={!list.length}>전체 삭제</button>
      </div>
      {msg && <p className={msg.startsWith('가져오기 실패') ? 'error-text' : 'muted'}>{msg}</p>}

      {list.length > 0 && <Stats list={list} />}

      <h3>전체 기록</h3>
      {list.length === 0 ? (
        <p className="empty">아직 기록이 없습니다. 게임을 한 판 진행하면 여기에 쌓입니다.</p>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>날짜</th>
                <th>게임</th>
                <th>당첨</th>
                <th className="num">인원</th>
                <th>메뉴</th>
                <th className="num">금액</th>
              </tr>
            </thead>
            <tbody>
              {list.map((h) => (
                <tr key={h.id}>
                  <td className="tnum">{fmtDate(h.date)}</td>
                  <td>{h.game}</td>
                  <td className="strong">{h.winners.join(', ')}</td>
                  <td className="num">{h.players.length} 명</td>
                  <td>{h.menu ?? '-'}</td>
                  <td className="num">{h.amount != null ? `${h.amount.toLocaleString()} 원` : '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}

function Stats({ list }: { list: ReturnType<typeof storage.loadHistory> }) {
  const people = personStats(list)
  const games = gameStats(list)
  const total = list.reduce((a, h) => a + (h.amount ?? 0), 0)
  return (
    <>
      <div className="stats">
        <div className="stat">
          <span className="muted">총 게임</span>
          <b>{list.length.toLocaleString()} <span className="unit">회</span></b>
        </div>
        <div className="stat">
          <span className="muted">총 금액</span>
          <b>{total.toLocaleString()} <span className="unit">원</span></b>
        </div>
        <div className="stat">
          <span className="muted">최다 당첨</span>
          <b>{people[0]?.wins ? people[0].name : '-'}</b>
        </div>
        <div className="stat">
          <span className="muted">인기 게임</span>
          <b>{games[0]?.[0] ?? '-'}</b>
        </div>
      </div>

      <h3>사람별 통계</h3>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>이름</th>
              <th className="num">당첨</th>
              <th className="num">참가</th>
              <th className="num">당첨률</th>
              <th className="num">결제 금액</th>
            </tr>
          </thead>
          <tbody>
            {people.map((p) => (
              <tr key={p.name}>
                <td className="strong">{p.name}</td>
                <td className="num">{p.wins} 회</td>
                <td className="num">{p.plays} 회</td>
                <td className="num">{Math.round((p.wins / p.plays) * 100)} %</td>
                <td className="num">{Math.round(p.amount).toLocaleString()} 원</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}

/** YYYY-MM-DD HH:mm */
function fmtDate(iso: string) {
  const d = new Date(iso)
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`
}
