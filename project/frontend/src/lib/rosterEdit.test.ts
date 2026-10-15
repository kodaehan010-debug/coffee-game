import { describe, expect, it } from 'vitest'
import { addMember, filterRoster, removeMember } from './rosterEdit'

const R = [{ team: 'A', name: '가나' }, { team: 'B', name: '다라' }]

describe('rosterEdit', () => {
  it('추가: 공백 정리, 빈 값·중복 거부, 다른 팀 동명 허용', () => {
    expect(addMember(R, ' C ', ' 마  바 ')).toEqual([...R, { team: 'C', name: '마 바' }])
    expect(typeof addMember(R, 'A', '가나')).toBe('string')
    expect(typeof addMember(R, '', 'x')).toBe('string')
    expect(addMember(R, 'B', '가나')).toHaveLength(3)
  })
  it('삭제', () => expect(removeMember(R, { team: 'A', name: '가나' })).toEqual([R[1]]))
  it('필터: 팀 + 검색', () => {
    expect(filterRoster(R, 'B', '')).toEqual([R[1]])
    expect(filterRoster(R, '', '가')).toEqual([R[0]])
    expect(filterRoster(R, 'A', '다')).toEqual([])
  })
})
