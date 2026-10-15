// 명단 관리 화면용 순수 함수 (추가·삭제·필터)
import type { Member } from './roster'

const clean = (v: string) => v.replace(/\s+/g, ' ').trim()

/** 명단에 추가. 빈 값·중복(같은 팀+이름)이면 오류 메시지 반환 */
export function addMember(roster: Member[], team: string, name: string): Member[] | string {
  const m = { team: clean(team), name: clean(name) }
  if (!m.team || !m.name) return '팀과 이름을 입력하세요.'
  if (roster.some((o) => o.team === m.team && o.name === m.name)) return '이미 같은 팀에 같은 이름이 있습니다.'
  return [...roster, m]
}

export const removeMember = (roster: Member[], m: Member) =>
  roster.filter((o) => !(o.team === m.team && o.name === m.name))

/** 팀(''=전체) + 검색어(이름·팀 부분 일치, 공백 무시) 필터 */
export function filterRoster(roster: Member[], team: string, q: string): Member[] {
  const s = q.replace(/\s/g, '').toLowerCase()
  return roster.filter(
    (m) => (!team || m.team === team) && (!s || (m.name + m.team).replace(/\s/g, '').toLowerCase().includes(s)),
  )
}
