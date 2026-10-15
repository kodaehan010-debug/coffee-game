// 조추첨 기록 저장 (localStorage: td.history)
import type { DrawConfig, DrawResult } from './teamDraw'

export type DrawRecord = {
  id: string
  date: string // ISO
  count: number
  config: DrawConfig & { spread: boolean; seeds: number }
  result: DrawResult
  depts: Record<string, string> // 이름 → 소속 (기록 시점)
}

const KEY = 'td.history'
export const tdHistory = {
  load(): DrawRecord[] {
    try { const v = localStorage.getItem(KEY); return v ? (JSON.parse(v) as DrawRecord[]) : [] } catch { return [] }
  },
  save(list: DrawRecord[]) {
    try { localStorage.setItem(KEY, JSON.stringify(list)) } catch { /* 무시 */ }
  },
  add(r: DrawRecord) { tdHistory.save([r, ...tdHistory.load()].slice(0, 100)) },
}

/** YYYY-MM-DD HH:mm */
export const fmtDate = (iso: string) => {
  const d = new Date(iso)
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`
}

/** 텍스트 파일 다운로드 (CSV는 엑셀 한글 깨짐 방지용 BOM) */
export function download(name: string, text: string) {
  const a = document.createElement('a')
  a.href = URL.createObjectURL(new Blob(['\uFEFF' + text], { type: 'text/csv;charset=utf-8' }))
  a.download = name
  a.click()
  URL.revokeObjectURL(a.href)
}
