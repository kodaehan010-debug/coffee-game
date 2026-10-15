import { HashRouter, NavLink, Outlet, Route, Routes, useLocation } from 'react-router-dom'
import { AppStateProvider } from './AppState'
import Icon from './components/Icon'
import { GamePage } from './games/GamePage'
import { GAMES } from './games/registry'
import Games from './pages/Games'
import History from './pages/History'
import Home from './pages/Home'
import Result from './pages/Result'
import Settings from './pages/Settings'

const MENU = [
  { to: '/', label: '홈', icon: 'home' },
  { to: '/games', label: '게임', icon: 'grid' },
  { to: '/history', label: '기록', icon: 'list' },
  { to: '/settings', label: '설정', icon: 'settings' },
]

function useTitle() {
  const path = useLocation().pathname
  const game = GAMES.find((g) => path === `/games/${g.id}`)
  if (game) return game.name
  if (path === '/result') return '결과'
  return { '/': '참가자 입력', '/games': '게임 선택', '/history': '기록·통계', '/settings': '설정' }[path] ?? ''
}

function Layout() {
  const title = useTitle()
  return (
    <div className="shell">
      <header className="topbar">
        <span className="brand">SK ONS</span>
        <span className="divider" />
        <span>coffee game</span>
        {title && <span className="page-title">· {title}</span>}
      </header>
      <nav className="rail" aria-label="메뉴">
        {MENU.map((m) => (
          <NavLink key={m.to} to={m.to} end={m.to === '/'}>
            <span className="pill">
              <Icon name={m.icon} />
            </span>
            <span>{m.label}</span>
          </NavLink>
        ))}
      </nav>
      <main>
        <Outlet />
      </main>
    </div>
  )
}

// HashRouter : GitHub Pages 에서 새로고침 시 404 방지
export default function App() {
  return (
    <AppStateProvider>
      <HashRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Home />} />
            <Route path="/games" element={<Games />} />
            <Route path="/games/:id" element={<GamePage />} />
            <Route path="/result" element={<Result />} />
            <Route path="/history" element={<History />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="*" element={<p className="empty">페이지를 찾을 수 없습니다.</p>} />
          </Route>
        </Routes>
      </HashRouter>
    </AppStateProvider>
  )
}
