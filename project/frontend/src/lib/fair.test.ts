import { expect, it } from 'vitest'
import { fairWeights, weightedIndex, weightedPick } from './draw'

it('보정 가중치: 최소 당첨 기준 1/(1+차이)', () => {
  const wins: Record<string, number> = { a: 2, b: 3, c: 4 }
  const w = fairWeights(['a', 'b', 'c'], (n) => wins[n])
  expect([w('a'), w('b'), w('c')]).toEqual([1, 0.5, 1 / 3])
})

it('가중치 비례 선택 (1:1:2, 8,000회 ±10%)', () => {
  const cnt = [0, 0, 0]
  for (let i = 0; i < 8000; i++) cnt[weightedIndex([1, 1, 2])]++
  ;[2000, 2000, 4000].forEach((e, i) => expect(Math.abs(cnt[i] - e) / e).toBeLessThan(0.1))
})

it('weightedPick 중복 없음', () => {
  const r = weightedPick(['a', 'b', 'c', 'd'], 3, () => 1)
  expect(new Set(r).size).toBe(3)
})
