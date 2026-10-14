// 저장소 인터페이스: 현재 localStorage, 향후 API 로 교체 지점

export type HistoryEntry = {
  id: string
  date: string // ISO
  game: string
  players: string[]
  winners: string[]
  menu?: string
  amount?: number
}

export type Settings = { sound: boolean; winners: number }

const KEY = { players: 'cg.players', settings: 'cg.settings', history: 'cg.history' }

function read<T>(key: string, fallback: T): T {
  try {
    const v = localStorage.getItem(key)
    return v ? (JSON.parse(v) as T) : fallback
  } catch {
    return fallback
  }
}

function write(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    /* 저장 불가 환경(시크릿 모드 등) 무시 */
  }
}

export const storage = {
  loadPlayers: () => read<string[]>(KEY.players, []),
  savePlayers: (p: string[]) => write(KEY.players, p),

  loadSettings: () => read<Settings>(KEY.settings, { sound: true, winners: 1 }),
  saveSettings: (s: Settings) => write(KEY.settings, s),

  loadHistory: () => read<HistoryEntry[]>(KEY.history, []),
  saveHistory: (h: HistoryEntry[]) => write(KEY.history, h),

  addHistory(e: Omit<HistoryEntry, 'id' | 'date'>): HistoryEntry {
    const entry = { ...e, id: crypto.randomUUID(), date: new Date().toISOString() }
    this.saveHistory([entry, ...this.loadHistory()])
    return entry
  },

  updateHistory(id: string, patch: Partial<HistoryEntry>) {
    this.saveHistory(this.loadHistory().map((h) => (h.id === id ? { ...h, ...patch } : h)))
  },
}

/** 기록 JSON 파싱 (가져오기). 형식 오류 시 예외 */
export function parseHistory(text: string): HistoryEntry[] {
  const data = JSON.parse(text)
  if (!Array.isArray(data)) throw new Error('배열 형식이 아님')
  for (const h of data) {
    if (typeof h.id !== 'string' || !Array.isArray(h.winners)) throw new Error('기록 형식 오류')
  }
  return data
}
