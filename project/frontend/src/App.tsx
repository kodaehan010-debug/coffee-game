import { HashRouter, NavLink, Outlet, Route, Routes, useLocation } from 'react-router-dom'
import { AppStateProvider } from './AppState'
import Icon from './components/Icon'
import { GamePage } from './games/GamePage'
import { GAMES } from './games/registry'
import DrawHistory from './pages/draw/DrawHistory'
import DrawRoster from './pages/draw/DrawRoster'
import DrawRun from './pages/draw/DrawRun'
import DrawSetup from './pages/draw/DrawSetup'
import Games from './pages/Games'
import History from './pages/History'
import Home from './pages/Home'
import Result from './pages/Result'
import Roster from './pages/Roster'
import Settings from './pages/Settings'

const MENU = [
  { to: '/', label: '홈', icon: 'home' },
  { to: '/games', label: '게임', icon: 'grid' },
  { to: '/history', label: '기록', icon: 'list' },
  { to: '/settings', label: '설정', icon: 'settings' },
]
const DRAW_MENU = [
  { to: '/draw', label: '명단', icon: 'groups' },
  { to: '/draw/setup', label: '설정', icon: 'settings' },
  { to: '/draw/run', label: '추첨', icon: 'shuffle' },
  { to: '/draw/history', label: '기록', icon: 'list' },
  { to: '/draw/settings', label: '명단 관리', icon: 'list' },
]
const APPS = [
  { to: '/', label: '커피', name: 'coffee game', icon: 'coffee' },
  { to: '/draw', label: '조추첨', name: '조추첨', icon: 'groups' },
]
const isDraw = (path: string) => path === '/draw' || path.startsWith('/draw/')

function useTitle() {
  const path = useLocation().pathname
  const game = GAMES.find((g) => path === `/games/${g.id}`)
  if (game) return game.name
  if (path === '/result') return '결과'
  return {
    '/draw': '추첨 명단', '/draw/setup': '추첨 설정', '/draw/run': '추첨 시작', '/draw/history': '추첨 기록', '/draw/settings': '명단 관리', '/': '참가자 입력', '/games': '게임 선택', '/history': '기록·통계', '/settings': '설정', '/settings/roster': '명단 관리' }[path] ?? ''
}

function Layout() {
  const title = useTitle()
  const draw = isDraw(useLocation().pathname)
  const app = APPS[draw ? 1 : 0]
  const other = APPS[draw ? 0 : 1]
  const menu = draw ? DRAW_MENU : MENU
  return (
    <div className="shell">
      <header className="topbar">
        <span className="brand">SK ONS</span>
        <span className="divider" />
        <span>{app.name}</span>
        {title && <span className="page-title">· {title}</span>}
      </header>
      <nav className="rail" aria-label="메뉴">
        <div className="app-switch" role="group" aria-label="앱 선택">
          {APPS.map((a) => (
            <NavLink key={a.to} to={a.to} className={a === app ? 'active' : ''} aria-current={a === app ? 'page' : undefined}>
              <span className="pill"><Icon name={a.icon} /></span>
              <span>{a.label}</span>
            </NavLink>
          ))}
        </div>
        {menu.map((m) => (
          <NavLink key={m.to} to={m.to} end={m.to === '/' || m.to === '/draw'}>
            <span className="pill">
              <Icon name={m.icon} />
            </span>
            <span>{m.label}</span>
          </NavLink>
        ))}
        <NavLink to={other.to} className="app-toggle" end>
          <span className="pill"><Icon name={other.icon} /></span>
          <span>{other.label}로 전환</span>
        </NavLink>
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
            <Route path="/settings/roster" element={<Roster />} />
            <Route path="/draw" element={<DrawRoster />} />
            <Route path="/draw/setup" element={<DrawSetup />} />
            <Route path="/draw/run" element={<DrawRun />} />
            <Route path="/draw/history" element={<DrawHistory />} />
            <Route path="/draw/settings" element={<Roster />} />
            <Route path="*" element={<p className="empty">페이지를 찾을 수 없습니다.</p>} />
          </Route>
        </Routes>
      </HashRouter>
    </AppStateProvider>
  )
}
