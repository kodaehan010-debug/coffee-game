import { describe, expect, it } from 'vitest'
import { teamsOf } from './roster'

describe('teamsOf 정렬', () => {
  it('지정 순서 + 미매칭 팀은 뒤에 원래 순서', () => {
    const teams = ['서부본부', '기타A', '강원', '충청', '경남', '설계팀', '강남', '기술팀', '강북', '경북', '기타B']
    const r = teamsOf(teams.map((team) => ({ team, name: 'x' })))
    expect(r).toEqual(['기술팀', '설계팀', '강남', '강북', '경남', '경북', '서부본부', '충청', '강원', '기타A', '기타B'])
  })
})
