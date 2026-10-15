// 엑셀 명단(팀·이름) 파싱·정규화 + 즐겨찾기 저장
export type Member = { team: string; name: string }
export type Favorite = { id: string; name: string; players: string[] }

const TEAM_KEYS = ['팀', '팀명', '소속', '부서', 'team']
const NAME_KEYS = ['이름', '성명', '참가자', 'name']

const clean = (v: unknown) => String(v ?? '').replace(/\s+/g, ' ').trim()
const key = (v: unknown) => clean(v).replace(/\s/g, '').toLowerCase()

/** 2차원 셀 배열 → 명단. 첫 10행 안에서 팀/이름 헤더 탐색, 없으면 1·2열 사용 */
export function parseRoster(rows: unknown[][]): Member[] {
  let h = -1, ti = 0, ni = 1
  for (let r = 0; r < Math.min(rows.length, 10) && h < 0; r++) {
    const ks = rows[r].map(key)
    const t = ks.findIndex((k) => TEAM_KEYS.includes(k))
    const n = ks.findIndex((k) => NAME_KEYS.includes(k))
    if (t >= 0 && n >= 0) [h, ti, ni] = [r, t, n]
  }
  const out: Member[] = []
  const seen = new Set<string>()
  for (const row of rows.slice(h + 1)) {
    const team = clean(row[ti]) || '미지정'
    const name = clean(row[ni])
    const id = team + '\u0000' + name
    if (!name || seen.has(id)) continue
    seen.add(id)
    out.push({ team, name })
  }
  return out
}

/** 팀 표시 순서 (팀 이름에 포함된 키워드로 매칭) */
export const TEAM_ORDER = ['기술', '설계', '강남', '강북', '경남', '경북', '서부', '충청', '강원']
const rank = (t: string) => { const i = TEAM_ORDER.findIndex((k) => t.includes(k)); return i < 0 ? TEAM_ORDER.length : i }

/** 팀 목록 (TEAM_ORDER 순, 미매칭 팀은 뒤에 등장 순서대로) */
export const teamsOf = (roster: Member[]) =>
  [...new Set(roster.map((m) => m.team))].sort((a, b) => rank(a) - rank(b))

/** 참가자 표시 이름. 다른 팀에 동명이인이 있을 때만 "이름(팀)" */
export function displayName(m: Member, roster: Member[]): string {
  const dup = roster.some((o) => o.name === m.name && o.team !== m.team)
  return dup ? `${m.name}(${m.team})` : m.name
}

const read = <T,>(k: string, f: T): T => {
  try { const v = localStorage.getItem(k); return v ? (JSON.parse(v) as T) : f } catch { return f }
}
const write = (k: string, v: unknown) => {
  try { localStorage.setItem(k, JSON.stringify(v)) } catch { /* 무시 */ }
}

// 기본 명단: src/data/roster.local.json (git 제외 파일). 없으면 빈 명단 (배포 사이트)
const files = import.meta.glob<Member[]>('../data/roster.local.json', { eager: true, import: 'default' })
export const baseRoster: Member[] = Object.values(files)[0] ?? []

export const rosterStore = {
  /** 저장된(추가·삭제 반영) 명단, 없으면 기본 명단 */
  load: () => read<Member[] | null>('cg.roster', null) ?? baseRoster,
  /** 기본 명단으로 되돌리기 */
  reset: () => { try { localStorage.removeItem('cg.roster') } catch { /* 무시 */ } },
  save: (r: Member[]) => write('cg.roster', r),
  loadFavorites: () => read<Favorite[]>('cg.favorites', []),
  saveFavorites: (f: Favorite[]) => write('cg.favorites', f),
}
