import { randInt, shuffle, type Rng } from './draw'

// 사다리: rungs[row] = 가로줄이 놓인 왼쪽 세로줄 번호 목록
export type Ladder = { cols: number; rows: number; rungs: number[][] }

/** 사다리 생성 (인접 가로줄 겹침 방지) */
export function makeLadder(cols: number, rows = 12, rng?: Rng): Ladder {
  const rungs: number[][] = []
  for (let r = 0; r < rows; r++) {
    const row: number[] = []
    for (let c = 0; c < cols - 1; c++) {
      if (row.includes(c - 1)) continue
      if (randInt(100, rng) < 45) row.push(c)
    }
    rungs.push(row)
  }
  return { cols, rows, rungs }
}

/** 출발 세로줄 → 도착 세로줄. path: 각 row 진입 시 위치 */
export function tracePath(l: Ladder, start: number): { end: number; path: number[] } {
  let c = start
  const path = [c]
  for (const row of l.rungs) {
    if (row.includes(c)) c += 1
    else if (row.includes(c - 1)) c -= 1
    path.push(c)
  }
  return { end: c, path }
}

/** 도착 칸 중 k개를 '당첨'으로 지정 */
export function makePrizes(cols: number, k: number, rng?: Rng): boolean[] {
  const idx = shuffle([...Array(cols).keys()], rng).slice(0, k)
  return [...Array(cols).keys()].map((i) => idx.includes(i))
}

/** 경로의 꺾이는 점 목록 [col, row]. row -1 = 맨 위, rows = 맨 아래, 같은 줄 직진 점은 생략 */
export function pathCorners(l: Ladder, start: number): [number, number][] {
  const { path } = tracePath(l, start)
  const pts: [number, number][] = [[start, -1]]
  for (let r = 0; r < l.rows; r++) {
    if (path[r + 1] !== path[r]) pts.push([path[r], r], [path[r + 1], r])
  }
  pts.push([path[l.rows], l.rows])
  return pts
}

/** 구간별 이동 시간(ms). 거리 비례 + 아래로 갈수록 느려짐, 총합 ≈ total */
export function stepDurations(corners: [number, number][], rows: number, total = 5000): number[] {
  const raw = corners.slice(1).map(([c, r], k) => {
    const [pc, pr] = corners[k]
    const dist = Math.abs(c - pc) * 2 + Math.abs(r - pr) // 가로 1칸 = 세로 2줄 가중
    const depth = (r + 1) / (rows + 1) // 0~1
    return (dist + 1.5) * (1 + 2 * depth * depth) // 바닥 근처 최대 3배 느림
  })
  const sum = raw.reduce((a, b) => a + b, 0)
  return raw.map((v) => Math.round((v / sum) * total))
}
