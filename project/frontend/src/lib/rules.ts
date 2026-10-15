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

/**
 * 경주 한 틱: 기본 0~maxStep 랜덤 전진 + 엎치락뒤치락 요소 (모든 말에 같은 규칙 → 공정)
 * - 뒤처진 말은 따라잡기 보너스, 앞선 말은 가끔 숨 고르기
 * - 가끔 질주(+4~6) / 헛발(0)
 */
export function raceStep(pos: number[], maxStep = 3, rng?: Rng): number[] {
  const mean = pos.reduce((a, b) => a + b, 0) / pos.length
  return pos.map((p) => {
    const r = randInt(100, rng)
    if (r < 6) return p + 4 + randInt(3, rng) // 질주
    if (r < 12) return p // 헛발
    let step = randInt(maxStep + 1, rng)
    if (p < mean - 6) step += randInt(3, rng) // 추격
    else if (p > mean + 6 && randInt(2, rng)) step = Math.max(0, step - 1) // 숨 고르기
    return p + step
  })
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
