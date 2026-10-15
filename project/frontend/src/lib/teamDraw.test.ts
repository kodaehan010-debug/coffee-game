import { describe, expect, it } from 'vitest'
import { drawTeams, previewText, resultCsv, type Person } from './teamDraw'

const make = (n: number, depts: number): Person[] =>
  Array.from({ length: n }, (_, i) => ({ name: `P${i}`, dept: `D${i % depts}` }))
const all = (r: ReturnType<typeof drawTeams>) => r.groups.flatMap((g) => g.teams)

describe('teamDraw', () => {
  it('60명 → A1~C5, 4명씩, 전원 1회', () => {
    const r = drawTeams(make(60, 6), { groups: 3, teamsPerGroup: 5 }, { spread: true, seeds: [] })
    const teams = all(r)
    expect(teams.map((t) => t.id)).toEqual(['A', 'B', 'C'].flatMap((g) => [1, 2, 3, 4, 5].map((i) => g + i)))
    expect(teams.every((t) => t.members.length === 4)).toBe(true)
    const names = teams.flatMap((t) => t.members)
    expect(new Set(names).size).toBe(60)
    expect(names.length).toBe(60)
  })

  it('나머지 분배: 최대-최소 ≤ 1', () => {
    for (let k = 0; k < 20; k++) {
      const r = drawTeams(make(62, 5), { groups: 3, teamsPerGroup: 5 }, { spread: k % 2 === 0, seeds: [] })
      const s = all(r).map((t) => t.members.length)
      expect(Math.max(...s) - Math.min(...s)).toBeLessThanOrEqual(1)
      expect(s.reduce((a, b) => a + b)).toBe(62)
    }
    expect(previewText(60, 15)).toBe('4명 × 15팀')
    expect(previewText(62, 15)).toBe('4명 13팀 + 5명 2팀')
  })

  it('소속 분산: 피할 수 있으면 같은 소속 2명 없음', () => {
    // 소속 6개 × 10명, 15팀 × 4명 → 각 팀 소속 모두 다르게 가능
    for (let k = 0; k < 20; k++) {
      const r = drawTeams(make(60, 6), { groups: 3, teamsPerGroup: 5 }, { spread: true, seeds: [] })
      for (const t of all(r)) {
        const d = t.members.map((m) => Number(m.slice(1)) % 6)
        expect(new Set(d).size).toBe(d.length)
      }
    }
  })

  it('조장: 팀당 1명', () => {
    const seeds = Array.from({ length: 15 }, (_, i) => `P${i * 4}`)
    const r = drawTeams(make(60, 6), { groups: 3, teamsPerGroup: 5 }, { spread: true, seeds })
    for (const t of all(r)) expect(t.members.filter((m) => seeds.includes(m)).length).toBe(1)
  })

  it('CSV 헤더', () => {
    const r = drawTeams(make(4, 2), { groups: 1, teamsPerGroup: 2 }, { spread: false, seeds: [] })
    expect(resultCsv(r).split('\r\n')).toHaveLength(5)
  })
})

describe('강제 지정', () => {
  it('지정한 4명은 A1, 나머지는 균형 배치', () => {
    const people = Array.from({ length: 60 }, (_, i) => ({ name: `p${i}`, dept: `d${i % 6}` }))
    const fixed = { p0: 'A1', p1: 'A1', p2: 'A1', p3: 'A1', p10: 'B3' }
    const r = drawTeams(people, { groups: 3, teamsPerGroup: 5 }, { spread: true, seeds: [], fixed })
    const teams = r.groups.flatMap((g) => g.teams)
    const a1 = teams.find((t) => t.id === 'A1')!
    expect([...a1.members].sort()).toEqual(['p0', 'p1', 'p2', 'p3'])
    expect(teams.find((t) => t.id === 'B3')!.members).toContain('p10')
    expect(teams.flatMap((t) => t.members).length).toBe(60)
    teams.forEach((t) => expect(t.members.length).toBe(4))
  })
})

describe('조장 랜덤 + 강제 지정', () => {
  it('팀마다 조장 정확히 1명, 강제 지정 팀은 지정 인원 중 조장', () => {
    const fixed = { P0: 'A1', P1: 'A1', P7: 'B2' }
    for (let k = 0; k < 50; k++) {
      const r = drawTeams(make(60, 6), { groups: 3, teamsPerGroup: 5 }, { spread: true, seeds: [], randomSeeds: true, fixed })
      const seeds = r.seeds ?? []
      expect(seeds).toHaveLength(15)
      for (const t of all(r)) {
        const ls = t.members.filter((m) => seeds.includes(m))
        expect(ls).toHaveLength(1)
        const f = Object.keys(fixed).filter((n) => fixed[n as keyof typeof fixed] === t.id)
        if (f.length) expect(f).toContain(ls[0])
      }
    }
  })

  it('수동 조장 중 강제 지정된 사람은 그 팀 조장', () => {
    const seeds = ['P0', 'P5', 'P9']
    const r = drawTeams(make(20, 4), { groups: 1, teamsPerGroup: 5 }, { spread: false, seeds, fixed: { P0: 'A3' } })
    expect(all(r).find((t) => t.id === 'A3')!.members).toContain('P0')
    for (const t of all(r)) expect(t.members.filter((m) => r.seeds!.includes(m)).length).toBeLessThanOrEqual(1)
    expect(r.seeds).toHaveLength(3)
  })
})

describe('같은 팀 금지', () => {
  it('200회: 그룹 분리 + 균형 + 전원 1회', () => {
    const apart = [['P0', 'P1', 'P2', 'P3'], ['P10', 'P11', 'P12']]
    for (let k = 0; k < 200; k++) {
      const r = drawTeams(make(60, 6), { groups: 3, teamsPerGroup: 5 }, { spread: k % 2 === 0, seeds: [], randomSeeds: k % 3 === 0, apart, fixed: k % 4 === 0 ? { P0: 'A1', P10: 'A1' } : {} })
      expect(r.warnings).toBeUndefined()
      const teams = all(r)
      for (const t of teams) for (const g of apart) expect(t.members.filter((m) => g.includes(m)).length).toBeLessThanOrEqual(1)
      const sz = teams.map((t) => t.members.length)
      expect(Math.max(...sz) - Math.min(...sz)).toBeLessThanOrEqual(1)
      const names = teams.flatMap((t) => t.members)
      expect(new Set(names).size).toBe(60)
      expect(names.length).toBe(60)
    }
  })

  it('불가능하면 warnings 반환', () => {
    const r = drawTeams(make(6, 1), { groups: 1, teamsPerGroup: 2 }, { spread: false, seeds: [], apart: [['P0', 'P1', 'P2']] })
    expect(r.warnings?.length).toBe(1)
    expect(all(r).flatMap((t) => t.members)).toHaveLength(6)
  })
})
