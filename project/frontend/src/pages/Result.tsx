import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { storage } from '../lib/storage'

export default function Result() {
  const { id, gameId } = (useLocation().state as { id?: string; gameId?: string } | null) ?? {}
  const navigate = useNavigate()
  const entry = storage.loadHistory().find((h) => h.id === id)
  const [menu, setMenu] = useState(entry?.menu ?? '')
  const [amount, setAmount] = useState(entry?.amount?.toString() ?? '')
  const [saved, setSaved] = useState(false)

  if (!entry)
    return (
      <section>
        <p className="empty">표시할 결과가 없습니다.</p>
        <Link to="/games">게임 고르기</Link>
      </section>
    )

  const save = () => {
    storage.updateHistory(entry.id, { menu: menu.trim() || undefined, amount: amount ? Number(amount) : undefined })
    setSaved(true)
  }

  return (
    <section>
      <p className="muted">{entry.game} 결과</p>
      <h2>오늘의 커피 당번</h2>
      <div className="winners">
        {entry.winners.map((w) => (
          <div key={w} className="winner">{w}</div>
        ))}
      </div>

      <h3>메모 (선택)</h3>
      <div className="row center" style={{ maxWidth: 640, margin: '0 auto' }}>
        <div className="field">
          <label htmlFor="menu">메뉴</label>
          <input id="menu" placeholder="예: 아메리카노 5잔" value={menu} onChange={(e) => setMenu(e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="amount">금액 (원)</label>
          <input id="amount" type="number" min={0} placeholder="예: 22500" value={amount} onChange={(e) => setAmount(e.target.value)} />
        </div>
        <button onClick={save}>{saved ? '저장됨' : '저장'}</button>
      </div>

      <div className="row center">
        {gameId && <button className="primary" onClick={() => navigate(`/games/${gameId}`)}>다시하기</button>}
        <Link className="btn" to="/games">다른 게임</Link>
        <Link className="btn" to="/history">기록 보기</Link>
      </div>
    </section>
  )
}
