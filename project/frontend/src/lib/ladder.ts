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
