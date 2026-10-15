import { describe, expect, it } from 'vitest'
import { displayName, memberOf, parseRoster, shortLabel, teamsOf } from './roster'

describe('parseRoster', () => {
  it('헤더(팀/이름) 탐색 + 공백 정리 + 중복·빈칸 제거', () => {
    const r = parseRoster([['명단'], [' 팀 ', '이름'], ['A', ' 김 가 '], ['A', '김 가'], ['B', ''], [null, '박']])
    expect(r).toEqual([{ team: 'A', name: '김 가' }, { team: '미지정', name: '박' }])
  })
  it('열 순서가 바뀌어도 인식', () => {
    expect(parseRoster([['이름', '팀'], ['이', 'C']])).toEqual([{ team: 'C', name: '이' }])
  })
  it('헤더 없으면 1열=팀, 2열=이름', () => {
    expect(parseRoster([['A', '김']])).toEqual([{ team: 'A', name: '김' }])
  })
})

describe('displayName', () => {
  const roster = [{ team: 'A', name: '김' }, { team: 'B', name: '김' }, { team: 'A', name: '이' }]
  it('다른 팀 동명이인만 팀 표시', () => {
    expect(displayName(roster[0], roster)).toBe('김(A)')
    expect(displayName(roster[2], roster)).toBe('이')
    expect(teamsOf(roster)).toEqual(['A', 'B'])
  })
})

describe('memberOf', () => {
  it('표시 이름 → 구성원 (동명이인은 팀 표기로 구분)', () => {
    const roster = [{ team: 'A', name: '김' }, { team: 'B', name: '김' }, { team: 'A', name: '이' }]
    expect(memberOf('김(B)', roster)).toEqual({ team: 'B', name: '김' })
    expect(memberOf('이', roster)).toEqual({ team: 'A', name: '이' })
    expect(memberOf('김', roster)).toBeUndefined()
    expect(memberOf('없음', roster)).toBeUndefined()
  })
})

describe('shortLabel', () => {
  it('명단 안에 동명이인 없으면 이름만', () => {
    const l = shortLabel(['홍길동(강북)', '김철수'])
    expect(l('홍길동(강북)')).toBe('홍길동')
    const l2 = shortLabel(['홍길동(강북)', '홍길동(강남)'])
    expect(l2('홍길동(강북)')).toBe('홍길동(강북)')
  })
})
