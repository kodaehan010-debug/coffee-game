import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { useAppState } from '../AppState'
import { fanfare } from '../lib/sound'
import { storage } from '../lib/storage'
import { GAMES } from './registry'

export function GamePage() {
  const { id } = useParams()
  const { players, settings } = useAppState()
  const navigate = useNavigate()
  const game = GAMES.find((g) => g.id === id)

  if (!game) return <Navigate to="/games" replace />
  if (players.length < 2) return <Navigate to="/" replace />

  const k = Math.min(settings.winners, players.length - 1)

  const finish = (winners: string[]) => {
    fanfare(settings.sound)
    const entry = storage.addHistory({ game: game.name, players, winners })
    navigate('/result', { state: { id: entry.id, gameId: game.id } })
  }

  const G = game.Component
  return (
    <section>
      <h2>
        {game.emoji} {game.name}
      </h2>
      <p className="muted">
        참가 {players.length}명 · 당첨 {k}명 · <Link to="/games">다른 게임</Link>
      </p>
      {/* key: 재진입 시 상태 초기화 */}
      <G key={id} players={players} winners={k} sound={settings.sound} onFinish={finish} />
    </section>
  )
}
