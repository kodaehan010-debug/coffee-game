// 조추첨 결과 엑셀(.xlsx) 내보내기. exceljs는 다운로드 시에만 동적 로드
import type { DrawResult } from './teamDraw'

type Dept = (n: string) => string | undefined
export const XLSX_COL_KEY = 'td.xlsxCol'
export const DEFAULT_COL = '배정팀'

export type XlsxSheets = {
  main: { header: string[]; rows: string[][] }
  teams: { header: string[]; rows: (string | number)[][] }
}

const teamOrder = (a: string, b: string) => a.localeCompare(b, 'ko', { numeric: true })

/** 시트 데이터 구성 (exceljs 없이 테스트 가능). 배정결과는 팀 id 순(A1, A2…) */
export function buildXlsxSheets(r: DrawResult, dept?: Dept, colName = DEFAULT_COL): XlsxSheets {
  const seeds = new Set(r.seeds ?? [])
  const hasSeeds = seeds.size > 0
  const teams = r.groups.flatMap((g) => g.teams.map((t) => ({ ...t, group: g.label }))).sort((a, b) => teamOrder(a.id, b.id))
  const header = ['성명', '팀명', colName.trim() || DEFAULT_COL, ...(hasSeeds ? ['조장'] : [])]
  const rows = teams.flatMap((t) =>
    t.members.map((m) => [m, dept?.(m) ?? '', t.id, ...(hasSeeds ? [seeds.has(m) ? 'O' : ''] : [])]),
  )
  return {
    main: { header, rows },
    teams: { header: ['팀', '조', '인원', '팀원'], rows: teams.map((t) => [t.id, t.group, t.members.length, t.members.join(', ')]) },
  }
}

export async function downloadXlsx(name: string, r: DrawResult, dept?: Dept, colName = DEFAULT_COL) {
  const { default: ExcelJS } = await import('exceljs')
  const s = buildXlsxSheets(r, dept, colName)
  const wb = new ExcelJS.Workbook()
  const thin = { style: 'thin' as const }
  const border = { top: thin, left: thin, bottom: thin, right: thin }
  const center = { horizontal: 'center' as const, vertical: 'middle' as const }
  const fill = (argb: string) => ({ type: 'pattern' as const, pattern: 'solid' as const, fgColor: { argb } })

  const ws = wb.addWorksheet('배정결과', { views: [{ state: 'frozen', ySplit: 1 }] })
  ws.columns = s.main.header.map((_, i) => ({ width: [10, 16, 12, 8][i] }))
  ws.addRow(s.main.header)
  s.main.rows.forEach((row) => ws.addRow(row))
  ws.eachRow((row, rn) =>
    row.eachCell({ includeEmpty: true }, (c, cn) => {
      c.border = border
      c.alignment = center
      if (rn === 1) c.font = { bold: true }
      if (cn === 3) c.fill = fill(rn === 1 ? 'FFFFFF00' : 'FFFFF2CC')
    }),
  )
  ws.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: s.main.header.length } }

  const ts = wb.addWorksheet('팀별')
  ts.columns = [{ width: 8 }, { width: 10 }, { width: 8 }, { width: 60 }]
  ts.addRow(s.teams.header)
  s.teams.rows.forEach((row) => ts.addRow(row))
  ts.eachRow((row, rn) =>
    row.eachCell({ includeEmpty: true }, (c) => {
      c.border = border
      if (rn === 1) c.font = { bold: true }
    }),
  )

  const buf = await wb.xlsx.writeBuffer()
  const a = document.createElement('a')
  a.href = URL.createObjectURL(new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }))
  a.download = name
  a.click()
  setTimeout(() => URL.revokeObjectURL(a.href), 1000)
}

export const xlsxCol = {
  load: () => { try { return localStorage.getItem(XLSX_COL_KEY) ?? DEFAULT_COL } catch { return DEFAULT_COL } },
  save: (v: string) => { try { localStorage.setItem(XLSX_COL_KEY, v) } catch { /* 무시 */ } },
}
