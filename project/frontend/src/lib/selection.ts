// 명단 체크 ↔ 참가자 목록 변환 도우미
import { MAX_PLAYERS } from './draw'

/** 이름 하나 추가/제거 (최대 인원 초과 시 무시) */
export function toggle(players: string[], name: string, on: boolean, max = MAX_PLAYERS): string[] {
  if (!on) return players.filter((p) => p !== name)
  if (players.includes(name) || players.length >= max) return players
  return [...players, name]
}

/** 여러 명 한 번에 추가/제거. 추가는 남은 자리만큼만 */
export function setMany(players: string[], names: string[], on: boolean, max = MAX_PLAYERS): string[] {
  if (!on) {
    const s = new Set(names)
    return players.filter((p) => !s.has(p))
  }
  const out = [...players]
  for (const n of names) {
    if (out.length >= max) break
    if (!out.includes(n)) out.push(n)
  }
  return out
}

/** 이름 검색 (공백 무시, 대소문자 무시) */
export const matches = (name: string, q: string) =>
  name.replace(/\s/g, '').toLowerCase().includes(q.replace(/\s/g, '').toLowerCase())
