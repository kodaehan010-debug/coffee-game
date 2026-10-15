import { describe, expect, it } from 'vitest'
import { gameStats, narrow, personStats, raceStep, slowest } from './rules'
import type { HistoryEntry } from './storage'

describe('slowest', () => {
  it('느린 순, 부정출발(Infinity) 우선', () => {
    expect(slowest({ a: 300, b: Infinity, c: 500 }, 2)).toEqual(['b', 'c'])
  })
})

describe('narrow', () => {
  it('업/다운 범위 축소, 정답 판정', () => {
    expect(narrow([1, 100], 40, 50)).toEqual({ hit: false, range: [1, 49] })
    expect(narrow([1, 100], 40, 30)).toEqual({ hit: false, range: [31, 100] })
    expect(narrow([1, 100], 40, 40).hit).toBe(true)
  })
})

describe('raceStep', () => {
  it('뒤로 가지 않음, 최대 전진(질주 6) 이하', () => {
    const next = raceStep([0, 5, 10], 3)
    next.forEach((p, i) => {
      expect(p - [0, 5, 10][i]).toBeGreaterThanOrEqual(0)
      expect(p - [0, 5, 10][i]).toBeLessThanOrEqual(6)
    })
  })
})

describe('stats', () => {
  const h = (winners: string[], amount?: number, game = '룰렛'): HistoryEntry => ({
    id: Math.random().toString(),
    date: '2026-10-14T00:00:00Z',
    game,
    players: ['a', 'b', 'c'],
    winners,
    amount,
  })
  const list = [h(['a'], 10000), h(['a', 'b'], 20000, '사다리타기'), h(['c'])]

  it('사람별 당첨·참가·금액(공동 당첨 시 1/n)', () => {
    const s = personStats(list)
    expect(s[0]).toEqual({ name: 'a', wins: 2, plays: 3, amount: 20000 })
    expect(s.find((x) => x.name === 'b')?.amount).toBe(10000)
    expect(s.find((x) => x.name === 'c')?.wins).toBe(1)
  })

  it('게임별 횟수', () => {
    expect(gameStats(list)).toEqual([['룰렛', 2], ['사다리타기', 1]])
  })
})
