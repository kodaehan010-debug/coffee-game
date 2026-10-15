// 조추첨(팀 나누기) 순수 로직 — 화면과 분리
import { randInt, shuffle, type Rng } from './draw'

export type Person = { name: string; dept?: string }
export type DrawConfig = { groups: number; teamsPerGroup: number; labels?: string[] }
export type DrawOptions = {
  spread: boolean
  /** 수동 조장 목록 (randomSeeds 면 무시) */
  seeds: string[]
  /** true: 팀마다 조장 1명 무작위 (강제 지정 팀은 그 팀 지정 인원 중에서) */
  randomSeeds?: boolean
  /** 강제 지정: 이름 → 팀 id (예: 'A1'). 추첨 전 먼저 배치 */
  fixed?: Record<string, string>
  /** 같은 팀 금지 그룹: 같은 그룹 사람끼리 한 팀 불가 */
  apart?: string[][]
}
export type Team = { id: string; members: string[] }
export type Group = { label: string; teams: Team[] }
export type DrawResult = { groups: Group[]; /** 배치된 조장 */ seeds?: string[]; /** 지키지 못한 조건 안내 */ warnings?: string[] }

/** 기본 조 이름: A, B, C … */
export const defaultLabels = (n: number) =>
  Array.from({ length: n }, (_, i) => (i < 26 ? String.fromCharCode(65 + i) : `G${i + 1}`))

/** 팀 크기 계획: 기본 인원 + 1명 더 받는 팀 수 */
export function sizePlan(people: number, teams: number) {
  if (teams <= 0) return { base: 0, extra: 0, teams: 0 }
  return { base: Math.floor(people / teams), extra: people % teams, teams }
}

/** 미리보기 문구: "4명 × 15팀" / "4명 13팀 + 5명 2팀" */
export function previewText(people: number, teams: number): string {
  const { base, extra } = sizePlan(people, teams)
  if (!teams || !people) return '-'
  if (!extra) return `${base}명 × ${teams}팀`
  return `${base}명 ${teams - extra}팀 + ${base + 1}명 ${extra}팀`
}

/** 팀당 인원 → 조별 팀 수 환산 (총 팀 수를 조 수로 나눠 올림) */
export const teamsPerGroupFor = (people: number, size: number, groups: number) =>
  Math.max(1, Math.ceil(Math.max(1, Math.floor(people / Math.max(1, size))) / Math.max(1, groups)))

const MAX_TRY = 50

export function drawTeams(people: Person[], cfg: DrawConfig, opt: DrawOptions, rng?: Rng): DrawResult {
  let best: { r: DrawResult; bad: number } | null = null
  for (let k = 0; k < MAX_TRY; k++) {
    const r = drawOnce(people, cfg, opt, rng)
    if (!best || r.bad < best.bad) best = r
    if (!r.bad) break
  }
  const { r, bad } = best!
  return bad ? { ...r, warnings: [`같은 팀 금지 조건 ${bad}건을 지키지 못했습니다. (팀 수 부족 또는 강제 지정 충돌)`] } : r
}

function drawOnce(people: Person[], cfg: DrawConfig, opt: DrawOptions, rng?: Rng): { r: DrawResult; bad: number } {
  const labels = defaultLabels(cfg.groups).map((d, i) => cfg.labels?.[i]?.trim() || d)
  const groups: Group[] = labels.map((label) => ({
    label,
    teams: Array.from({ length: cfg.teamsPerGroup }, (_, j) => ({ id: `${label}${j + 1}`, members: [] })),
  }))
  const teams = groups.flatMap((g) => g.teams)
  const T = teams.length
  if (!T) return { r: { groups }, bad: 0 }

  const { base, extra } = sizePlan(people.length, T)
  const names = new Set(people.map((p) => p.name))
  const byId = new Map(teams.map((t) => [t.id, t]))
  const fixed = Object.entries(opt.fixed ?? {}).filter(([n, id]) => names.has(n) && byId.has(id))
  const fixedCnt = (t: Team) => fixed.filter(([, id]) => id === t.id).length
  // 정원: +1 자리는 강제 지정 인원이 많은 팀 우선, 나머지 무작위. 지정 인원이 정원보다 많으면 정원 확대
  const cap = new Map<Team, number>()
  shuffle(teams, rng)
    .sort((a, b) => fixedCnt(b) - fixedCnt(a))
    .forEach((t, i) => cap.set(t, Math.max(fixedCnt(t), base + (i < extra ? 1 : 0))))
  const deptOf = new Map(people.map((p) => [p.name, p.dept ?? '']))
  const deptCount = (t: Team, d: string) => t.members.filter((m) => deptOf.get(m) === d).length
  const open = () => teams.filter((t) => t.members.length < cap.get(t)!)

  // 같은 팀 금지: 이름 → 함께하면 안 되는 사람들
  const foes = new Map<string, Set<string>>()
  for (const g of opt.apart ?? []) for (const a of g) for (const b of g)
    if (a !== b && names.has(a) && names.has(b)) foes.set(a, (foes.get(a) ?? new Set()).add(b))
  const clash = (t: Team, n: string) => t.members.some((m) => foes.get(n)?.has(m))
  let bad = 0

  // 배치: 빈자리 팀 중 (금지 충돌 없는 팀 → 같은 소속 적은 순 → 인원 적은 순 → 무작위)
  const place = (name: string, useDept: boolean) => {
    const d = deptOf.get(name) ?? ''
    let cands = shuffle(open(), rng)
    const safe = cands.filter((t) => !clash(t, name))
    if (safe.length) cands = safe
    else bad++
    if (useDept && d) {
      const min = Math.min(...cands.map((t) => deptCount(t, d)))
      cands = cands.filter((t) => deptCount(t, d) === min)
    }
    const minLen = Math.min(...cands.map((t) => t.members.length))
    const pick = cands.filter((t) => t.members.length === minLen)
    pick[randInt(pick.length, rng)].members.push(name)
  }

  // 0) 강제 지정 인원 먼저 배치 (지정끼리 금지 충돌은 위반으로 집계)
  for (const [n, id] of fixed) {
    const t = byId.get(id)!
    if (clash(t, n)) bad++
    t.members.push(n)
  }
  const fixedNames = new Set(fixed.map(([n]) => n))
  const placed = new Set(fixedNames)

  // 1) 조장: 팀당 최대 1명
  const leaders: string[] = []
  const led = new Set<Team>()
  const lead = (t: Team, n: string) => { leaders.push(n); led.add(t) }
  if (opt.randomSeeds) {
    // 강제 지정 팀: 그 팀 지정 인원 중 무작위
    for (const t of teams) if (t.members.length) lead(t, t.members[randInt(t.members.length, rng)])
  } else {
    // 수동 조장 중 강제 지정된 사람은 그 팀 조장
    for (const [n, id] of fixed) if (opt.seeds.includes(n) && !led.has(byId.get(id)!)) lead(byId.get(id)!, n)
  }
  const pool = opt.randomSeeds
    ? shuffle(people.map((p) => p.name).filter((n) => !fixedNames.has(n)), rng)
    : shuffle(opt.seeds.filter((s) => names.has(s) && !fixedNames.has(s)), rng)
  for (const s of pool) {
    const t = shuffle(teams, rng).sort((a, b) => a.members.length - b.members.length)
      .find((x) => !led.has(x) && x.members.length < cap.get(x)! && !clash(x, s))
    if (!t) { if (opt.randomSeeds && led.size >= T) break; continue }
    t.members.push(s); lead(t, s); placed.add(s)
    if (led.size >= T) break
  }

  // 2) 같은 팀 금지 대상 먼저 (충돌 많은 사람부터)
  const rest = people.filter((p) => !placed.has(p.name))
  const tight = shuffle(rest.filter((p) => foes.has(p.name)), rng).sort((a, b) => foes.get(b.name)!.size - foes.get(a.name)!.size)
  for (const p of tight) place(p.name, opt.spread)
  const free = rest.filter((p) => !foes.has(p.name))

  // 3) 나머지: 소속 분산이면 큰 소속부터 돌려 배치, 아니면 완전 무작위
  if (opt.spread) {
    const by = new Map<string, string[]>()
    for (const p of shuffle(free, rng)) by.set(p.dept ?? '', [...(by.get(p.dept ?? '') ?? []), p.name])
    const order = shuffle([...by.values()], rng).sort((a, b) => b.length - a.length)
    for (const list of order) for (const n of list) place(n, true)
  } else {
    for (const p of shuffle(free, rng)) place(p.name, false)
  }
  return { r: { groups, seeds: leaders }, bad }
}

/** 결과 → 복사용 텍스트 */
export function resultText(r: DrawResult, dept?: (n: string) => string | undefined): string {
  return r.groups
    .map((g) => `[${g.label}조]\n` + g.teams.map((t) => `${t.id}: ${t.members.map((m) => (dept?.(m) ? `${m}(${dept(m)})` : m)).join(', ')}`).join('\n'))
    .join('\n\n')
}

/** 결과 → CSV (조,팀,번호,이름,소속) */
export function resultCsv(r: DrawResult, dept?: (n: string) => string | undefined): string {
  const q = (s: string) => `"${s.replace(/"/g, '""')}"`
  const rows = ['조,팀,번호,이름,소속']
  for (const g of r.groups) for (const t of g.teams) t.members.forEach((m, i) => rows.push([g.label, t.id, String(i + 1), m, dept?.(m) ?? ''].map(q).join(',')))
  return rows.join('\r\n')
}
