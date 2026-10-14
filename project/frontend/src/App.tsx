import { HashRouter, NavLink, Outlet, Route, Routes } from 'react-router-dom'
import { AppStateProvider } from './AppState'
import { GamePage } from './games/GamePage'
import Games from './pages/Games'
import History from './pages/History'
import Home from './pages/Home'
import Result from './pages/Result'
import Settings from './pages/Settings'

function Layout() {
  return (
    <>
      <header className="nav">
        <span className="logo">☕ coffee game</span>
        <nav>
          <NavLink to="/" end>홈</NavLink>
          <NavLink to="/games">게임</NavLink>
          <NavLink to="/history">기록</NavLink>
          <NavLink to="/settings">설정</NavLink>
        </nav>
      </header>
      <main>
        <Outlet />
      </main>
    </>
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
            <Route path="*" element={<p>페이지를 찾을 수 없습니다.</p>} />
          </Route>
        </Routes>
      </HashRouter>
    </AppStateProvider>
  )
}
