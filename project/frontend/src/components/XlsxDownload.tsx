// 조추첨 결과 엑셀 다운로드 버튼 + 결과 열 이름 입력
import { useState } from 'react'
import type { DrawResult } from '../lib/teamDraw'
import { DEFAULT_COL, downloadXlsx, xlsxCol } from '../lib/teamDrawXlsx'

type Props = { result: DrawResult; date: string; dept?: (n: string) => string | undefined }

export default function XlsxDownload({ result, date, dept }: Props) {
  const [col, setCol] = useState(xlsxCol.load)
  const [busy, setBusy] = useState(false)
  const run = async () => {
    setBusy(true)
    try { await downloadXlsx(`조추첨-${date.slice(0, 10)}.xlsx`, result, dept, col) }
    catch (e) { console.error('xlsx', e); alert(`엑셀 파일을 만들지 못했습니다. 다시 시도해 주세요.
(${e instanceof Error ? e.message : String(e)})`) }
    finally { setBusy(false) }
  }
  return (
    <span className="row">
      <input
        aria-label="결과 열 이름" title="결과 열 이름" placeholder={DEFAULT_COL} value={col} size={8}
        onChange={(e) => { setCol(e.target.value); xlsxCol.save(e.target.value) }}
      />
      <button onClick={run} disabled={busy}>{busy ? '만드는 중…' : '엑셀 다운로드'}</button>
    </span>
  )
}
