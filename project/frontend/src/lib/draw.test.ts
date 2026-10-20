import { describe, expect, it } from 'vitest'
import { MAX_PLAYERS, normalizeNames, pickWinners } from './draw'
import { makeLadder, makePrizes, tracePath } from './ladder'
import { parseHistory } from './storage'

const names = ['가', '나', '다', '라', '마']

describe('pickWinners', () => {
  it('k명, 중복 없이, 참가자 중에서', () => {
    const w = pickWinners(names, 3)
    expect(w).toHaveLength(3)
    expect(new Set(w).size).toBe(3)
    w.forEach((n) => expect(names).toContain(n))
  })

  it('인원보다 많은 k 는 인원수로 제한', () => {
    expect(pickWinners(['a', 'b'], 3)).toHaveLength(2)
  })

  it('공정성: 10,000회 분포가 균등(±15%)', () => {
    const cnt: Record<string, number> = {}
    const N = 10000
    for (let i = 0; i < N; i++) {
      const w = pickWinners(names, 1)[0]
      cnt[w] = (cnt[w] ?? 0) + 1
    }
    const expected = N / names.length
    names.forEach((n) => expect(Math.abs(cnt[n] - expected) / expected).toBeLessThan(0.15))
  })
})

describe('normalizeNames', () => {
  it('공백·빈값·중복 제거, 최대 60명', () => {
    expect(normalizeNames([' a ', '', 'a', 'b'])).toEqual(['a', 'b'])
    const many = Array.from({ length: 80 }, (_, i) => `p${i}`)
    expect(normalizeNames(many)).toHaveLength(MAX_PLAYERS)
  })
})

describe('ladder', () => {
  it('도착 지점은 1:1 대응(순열)', () => {
    for (const cols of [2, 5, 30]) {
      const l = makeLadder(cols)
      const ends = [...Array(cols).keys()].map((c) => tracePath(l, c).end)
      expect(new Set(ends).size).toBe(cols)
    }
  })

  it('당첨 칸 k개', () => {
    expect(makePrizes(10, 2).filter(Boolean)).toHaveLength(2)
  })
})

describe('parseHistory', () => {
  it('정상/오류 형식', () => {
    expect(parseHistory('[{"id":"1","winners":["a"]}]')).toHaveLength(1)
    expect(() => parseHistory('{}')).toThrow()
  })
})
