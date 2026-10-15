// 2차 게임·통계용 순수 로직
import { randInt, type Rng } from './draw'
import type { HistoryEntry } from './storage'

/** 반응속도: 기록(ms, 부정출발=Infinity)이 느린 순 k명 */
export function slowest(times: Record<string, number>, k: number): string[] {
  return Object.entries(times)
    .sort((a, b) => b[1] - a[1])
    .slice(0, k)
    .map(([n]) => n)
}

/** 업다운: 추측 후 남은 범위. hit=true 면 정답 */
export function narrow(range: [number, number], secret: number, guess: number) {
  if (guess === secret) return { hit: true, range }
  const next: [number, number] = guess < secret ? [guess + 1, range[1]] : [range[0], guess - 1]
  return { hit: false, range: next }
}

/** 경주 한 틱: 각 말 위치에 0~maxStep 랜덤 전진 */
export function raceStep(pos: number[], maxStep = 3, rng?: Rng): number[] {
  return pos.map((p) => p + randInt(maxStep + 1, rng))
}

export type PersonStat = { name: string; wins: number; plays: number; amount: number }

/** 사람별 당첨 횟수·참가 횟수·결제 금액 합계 */
export function personStats(list: HistoryEntry[]): PersonStat[] {
  const m = new Map<string, PersonStat>()
  const get = (n: string) => m.get(n) ?? m.set(n, { name: n, wins: 0, plays: 0, amount: 0 }).get(n)!
  for (const h of list) {
    h.players.forEach((p) => get(p).plays++)
    const share = h.amount ? h.amount / h.winners.length : 0
    h.winners.forEach((w) => {
      const s = get(w)
      s.wins++
      s.amount += share
    })
  }
  return [...m.values()].sort((a, b) => b.wins - a.wins || b.amount - a.amount)
}

/** 게임별 사용 횟수 */
export function gameStats(list: HistoryEntry[]): [string, number][] {
  const m = new Map<string, number>()
  list.forEach((h) => m.set(h.game, (m.get(h.game) ?? 0) + 1))
  return [...m.entries()].sort((a, b) => b[1] - a[1])
}
