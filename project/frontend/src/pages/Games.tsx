import { Link, useNavigate } from 'react-router-dom'
import { useAppState } from '../AppState'
import { randInt } from '../lib/draw'
import { GAMES } from '../games/registry'

export default function Games() {
  const { players } = useAppState()
  const navigate = useNavigate()

  if (players.length < 2)
    return (
      <section>
        <p>참가자를 먼저 2명 이상 입력해 주세요.</p>
        <Link to="/">← 참가자 입력</Link>
      </section>
    )

  return (
    <section>
      <h2>게임 선택</h2>
      <div className="cards">
        {GAMES.map((g) => (
          <Link key={g.id} to={`/games/${g.id}`} className="card">
            <div className="emoji">{g.emoji}</div>
            <strong>{g.name}</strong>
            <span className="muted">{g.desc}</span>
          </Link>
        ))}
      </div>
      <button className="primary big" onClick={() => navigate(`/games/${GAMES[randInt(GAMES.length)].id}`)}>
        🎲 랜덤 게임
      </button>
    </section>
  )
}
