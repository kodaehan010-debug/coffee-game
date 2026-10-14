import { useState, type ChangeEvent } from 'react'
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
      setMsg(`✅ ${merged.length - list.length}건 가져옴`)
    } catch (err) {
      setMsg(`❌ 가져오기 실패: ${(err as Error).message}`)
    }
  }

  const clear = () => {
    if (!confirm('모든 기록을 삭제할까요?')) return
    storage.saveHistory([])
    setList([])
  }

  return (
    <section>
      <h2>기록</h2>
      <div className="row center">
        <button onClick={exportJson} disabled={!list.length}>내보내기</button>
        <label className="btn">
          가져오기
          <input type="file" accept="application/json" hidden onChange={importJson} />
        </label>
        <button onClick={clear} disabled={!list.length}>전체 삭제</button>
      </div>
      {msg && <p>{msg}</p>}

      {list.length === 0 ? (
        <p className="muted">아직 기록이 없습니다.</p>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>날짜</th>
                <th>게임</th>
                <th>당첨</th>
                <th>인원</th>
                <th>메뉴</th>
                <th>금액</th>
              </tr>
            </thead>
            <tbody>
              {list.map((h) => (
                <tr key={h.id}>
                  <td>{new Date(h.date).toLocaleString('ko-KR', { dateStyle: 'short', timeStyle: 'short' })}</td>
                  <td>{h.game}</td>
                  <td><strong>{h.winners.join(', ')}</strong></td>
                  <td>{h.players.length}</td>
                  <td>{h.menu ?? '-'}</td>
                  <td>{h.amount != null ? `${h.amount.toLocaleString()}원` : '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
