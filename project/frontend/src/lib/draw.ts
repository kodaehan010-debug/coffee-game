// 공통 추첨 로직 (화면과 분리된 순수 함수 → 향후 서버/휴대폰 연동 시 재사용)

export type Rng = () => number

export const MAX_PLAYERS = 30
export const MAX_WINNERS = 3

/** 0 ~ n-1 정수 난수 (crypto 우선) */
export function randInt(n: number, rng?: Rng): number {
  if (rng) return Math.floor(rng() * n)
  const buf = new Uint32Array(1)
  crypto.getRandomValues(buf)
  return buf[0] % n
}

/** Fisher-Yates 셔플 (원본 불변) */
export function shuffle<T>(arr: readonly T[], rng?: Rng): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = randInt(i + 1, rng)
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/** 참가자 중 k명 당첨자 선택 */
export function pickWinners(names: readonly string[], k: number, rng?: Rng): string[] {
  return shuffle(names, rng).slice(0, Math.min(k, names.length))
}

/** 참가자 이름 정리: 공백 제거, 빈값·중복 제거, 최대 인원 제한 */
export function normalizeNames(input: readonly string[]): string[] {
  const out: string[] = []
  for (const raw of input) {
    const n = raw.trim()
    if (n && !out.includes(n)) out.push(n)
  }
  return out.slice(0, MAX_PLAYERS)
}

/** 가중치 비례 인덱스 선택 (가중치 합 0이면 균등) */
export function weightedIndex(weights: readonly number[], rng?: Rng): number {
  const total = weights.reduce((a, b) => a + b, 0)
  if (!(total > 0)) return randInt(weights.length, rng)
  let r = (randInt(1_000_000, rng) / 1_000_000) * total
  for (let i = 0; i < weights.length; i++) if ((r -= weights[i]) < 0) return i
  return weights.length - 1
}

/** 가중치 비례로 k명 선택 (중복 없음) */
export function weightedPick(names: readonly string[], k: number, weight: (n: string) => number, rng?: Rng): string[] {
  const pool = [...names]
  const out: string[] = []
  while (out.length < k && pool.length) out.push(pool.splice(weightedIndex(pool.map(weight), rng), 1)[0])
  return out
}

/**
 * 당첨 보정 가중치: 과거 당첨이 많을수록 낮음.
 * 참가자 중 최소 당첨 횟수 기준 차이 d → 1/(1+d)  (예: 0회 1, 1회 더 많음 0.5, 2회 0.33)
 */
export function fairWeights(players: readonly string[], wins: (n: string) => number): (n: string) => number {
  const min = Math.min(...players.map(wins))
  return (n) => 1 / (1 + wins(n) - min)
}
