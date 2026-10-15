import { describe, expect, it } from 'vitest'
import { buildXlsxSheets } from './teamDrawXlsx'

const r = { groups: [{ label: 'A조', teams: [{ id: 'A2', members: ['다', '라'] }, { id: 'A1', members: ['가', '나'] }] }] }

describe('buildXlsxSheets', () => {
  it('팀 id 순 행, 소속 빈칸 처리', () => {
    const s = buildXlsxSheets(r, (n) => (n === '가' ? '기획팀' : undefined))
    expect(s.main.header).toEqual(['성명', '팀명', '배정팀'])
    expect(s.main.rows).toEqual([['가', '기획팀', 'A1'], ['나', '', 'A1'], ['다', '', 'A2'], ['라', '', 'A2']])
    expect(s.teams.rows[0]).toEqual(['A1', 'A조', 2, '가, 나'])
  })
  it('열 이름 지정 + 조장 열', () => {
    const s = buildXlsxSheets({ ...r, seeds: ['다'] }, undefined, '윷놀이팀')
    expect(s.main.header).toEqual(['성명', '팀명', '윷놀이팀', '조장'])
    expect(s.main.rows[2]).toEqual(['다', '', 'A2', 'O'])
    expect(s.main.rows[0][3]).toBe('')
  })
  it('빈 열 이름은 기본값', () => {
    expect(buildXlsxSheets(r, undefined, ' ').main.header[2]).toBe('배정팀')
  })
})
