// 조추첨 공용 상태 (명단·설정·시작 화면이 공유). localStorage 'td.state' 에 저장
import { useState } from 'react'
import { defaultLabels, teamsPerGroupFor } from '../../lib/teamDraw'

export type DrawState = {
  selected: string[]
  groups: number
  mode: 'teams' | 'size'
  teamsPerGroup: number
  size: number
  labels: string[]
  spread: boolean
  useSeeds: boolean
  seeds: string[]
  /** true: 추첨 시작 시 조장을 팀 수만큼 무작위 지정 */
  randomSeeds: boolean
  /** 강제 지정: 이름 → 팀 id */
  fixed: Record<string, string>
  /** 같은 팀 금지 그룹 (그룹 안 사람끼리 한 팀 불가) */
  apart: string[][]
}

const KEY = 'td.state'
const DEFAULT: DrawState = {
  selected: [], groups: 3, mode: 'teams', teamsPerGroup: 5, size: 4, labels: [], spread: true, useSeeds: false, seeds: [], randomSeeds: false, fixed: {}, apart: [],
}

const load = (): DrawState => {
  try { return { ...DEFAULT, ...JSON.parse(localStorage.getItem(KEY) ?? '{}') } } catch { return DEFAULT }
}

export function useDrawState() {
  const [s, setS] = useState(load)
  const update = (patch: Partial<DrawState>) =>
    setS((p) => {
      const next = { ...p, ...patch }
      try { localStorage.setItem(KEY, JSON.stringify(next)) } catch { /* 무시 */ }
      return next
    })
  return [s, update] as const
}

/** 설정에서 파생되는 값: 조별 팀 수, 전체 팀 수, 조 이름, 유효 조장, 오류 문구 */
export function derive(s: DrawState) {
  const n = s.selected.length
  const tpg = s.mode === 'teams' ? s.teamsPerGroup : teamsPerGroupFor(n, s.size, s.groups)
  const total = s.groups * tpg
  const labelList = defaultLabels(s.groups).map((d, i) => s.labels[i]?.trim() || d)
  const validSeeds = s.seeds.filter((x) => s.selected.includes(x))
  const teamIds = labelList.flatMap((l) => Array.from({ length: tpg }, (_, j) => `${l}${j + 1}`))
  const validFixed = Object.fromEntries(Object.entries(s.fixed).filter(([x, id]) => s.selected.includes(x) && teamIds.includes(id)))
  // 같은 팀 금지: 선택된 사람만, 2명 이상 그룹만 유효
  const validApart = s.apart.map((g) => g.filter((x) => s.selected.includes(x))).filter((g) => g.length >= 2)
  const apartError = validApart.some((g) => g.length > total) ? `같은 팀 금지 그룹 인원이 팀 수(${total})보다 많습니다.`
    : validApart.some((g) => g.some((a, i) => g.some((b, j) => i < j && validFixed[a] && validFixed[a] === validFixed[b])))
      ? '같은 팀 금지 그룹의 두 사람이 같은 팀에 강제 지정되어 있습니다.' : ''
  const error =
    n < 2 ? '참가자를 2명 이상 선택하세요.'
    : total > n ? `팀 수(${total})가 인원(${n})보다 많습니다.`
    : s.useSeeds && !s.randomSeeds && validSeeds.length > total ? `조장은 팀 수(${total})명까지 지정할 수 있습니다.`
    : apartError
  return { n, tpg, total, labelList, validSeeds, teamIds, validFixed, validApart, error }
}
