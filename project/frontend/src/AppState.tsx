import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { storage, type Settings } from './lib/storage'

type AppState = {
  players: string[]
  setPlayers: (p: string[]) => void
  settings: Settings
  setSettings: (s: Settings) => void
}

const Ctx = createContext<AppState | null>(null)

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [players, setPlayers] = useState(storage.loadPlayers)
  const [settings, setSettings] = useState(storage.loadSettings)

  useEffect(() => storage.savePlayers(players), [players])
  useEffect(() => storage.saveSettings(settings), [settings])

  return <Ctx.Provider value={{ players, setPlayers, settings, setSettings }}>{children}</Ctx.Provider>
}

export function useAppState() {
  const v = useContext(Ctx)
  if (!v) throw new Error('AppStateProvider 누락')
  return v
}
