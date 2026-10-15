import { expect, it } from 'vitest'
import { shuffle } from './draw'
import { raceStep } from './rules'

// 경마 꼴찌 분포가 균등한지(5명, 3,000회)
it('경마 꼴찌 균등(±20%)', () => {
  const cnt = [0, 0, 0, 0, 0]
  for (let r = 0; r < 3000; r++) {
    let pos = [0, 0, 0, 0, 0]
    const order: number[] = []
    while (order.length < 5) {
      pos = raceStep(pos).map((p) => Math.min(100, p))
      const arrived = pos.map((p, i) => (p >= 100 && !order.includes(i) ? i : -1)).filter((i) => i >= 0)
      order.push(...shuffle(arrived))
    }
    cnt[order[4]]++
  }
  cnt.forEach((c) => expect(Math.abs(c - 600) / 600).toBeLessThan(0.2))
})
