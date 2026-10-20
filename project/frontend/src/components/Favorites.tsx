// 즐겨찾기 카드: 별 버튼으로 한 번에 불러오기. 커피게임·조추첨 공용 (cg.favorites)
import { useState } from 'react'
import type { Favorite } from '../lib/roster'
import Icon from './Icon'

type Props = { selected: string[]; onLoad: (players: string[]) => void; max?: number }

const KEY = 'cg.favorites'
const OLD_KEY = 'td.favorites' // 이전 조추첨 전용 키 → 공용 키로 병합

const read = (k: string): Favorite[] => {
  try { return JSON.parse(localStorage.getItem(k) ?? '[]') as Favorite[] } catch { return [] }
}

const readMerged = (): Favorite[] => {
  const cur = read(KEY)
  const old = read(OLD_KEY)
  if (old.length === 0) return cur
  const merged = [...cur, ...old.filter((o) => !cur.some((c) => c.name === o.name))]
  try { localStorage.setItem(KEY, JSON.stringify(merged)); localStorage.removeItem(OLD_KEY) } catch { /* 무시 */ }
  return merged
}

export default function Favorites({ selected, onLoad, max = Infinity }: Props) {
  const [favs, setFavs] = useState<Favorite[]>(readMerged)
  const [adding, setAdding] = useState(false)
  const [name, setName] = useState('')
  const [msg, setMsg] = useState('')

  const saveFavs = (f: Favorite[]) => {
    setFavs(f)
    try { localStorage.setItem(KEY,JSON.stringify(f)) } catch { /* 무시 */ }
  }
  const save = () => {
    const n = name.trim()
    if (!n || selected.length === 0) return
    saveFavs([...favs.filter((f) => f.name !== n), { id: String(Date.now()), name: n, players: selected }])
    setName('')
    setAdding(false)
    setMsg(`'${n}' 저장됨`)
  }
  const load = (f: Favorite) => {
    const list = [...new Set(f.players)].slice(0, max)
    onLoad(list)
    setMsg(f.players.length > list.length ? `'${f.name}' 불러옴 · 최대 ${max}명이라 ${f.players.length - list.length}명 제외` : `'${f.name}' 불러옴 (${list.length}명)`)
  }
  const remove = (f: Favorite) => {
    if (confirm(`즐겨찾기 '${f.name}'을(를) 삭제할까요?`)) saveFavs(favs.filter((x) => x.id !== f.id))
  }
  const same = (f: Favorite) => f.players.length === selected.length && f.players.every((p) => selected.includes(p))

  return (
    <div className="panel fav-card">
      <div className="panel-bar">
        <h3 className="fav-title"><span className="fav-star"><Icon name="star" size={20} /></span>즐겨찾기</h3>
        {!adding && (
          <button className="fav-add" disabled={selected.length === 0} onClick={() => setAdding(true)}
            title={selected.length ? '' : '참가자를 먼저 선택하세요'}>
            <Icon name="plus" size={16} /> 현재 선택 저장 <span className="tnum muted">{selected.length}명</span>
          </button>
        )}
      </div>

      {adding && (
        <div className="row fav-form">
          <div className="field">
            <label htmlFor="favname">즐겨찾기 이름</label>
            <input id="favname" autoFocus value={name} placeholder="예: 우리 팀 점심" onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.nativeEvent.isComposing) save(); if (e.key === 'Escape') setAdding(false) }} />
          </div>
          <button disabled={!name.trim()} onClick={save}>저장</button>
          <button className="link" onClick={() => setAdding(false)}>취소</button>
        </div>
      )}

      {favs.length === 0 ? (
        <p className="muted">참가자를 고른 뒤 "현재 선택 저장"을 누르면 여기에 별 버튼이 생깁니다.</p>
      ) : (
        <ul className="fav-list">
          {favs.map((f) => (
            <li key={f.id} className={same(f) ? 'on' : ''}>
              <button className="fav-load" aria-pressed={same(f)} onClick={() => load(f)} title="누르면 현재 선택이 이 목록으로 바뀜">
                <span className="fav-star"><Icon name="star" size={16} /></span>
                {f.name} <span className="tnum fav-n">{f.players.length}</span>
              </button>
              <button className="x" aria-label={`${f.name} 삭제`} onClick={() => remove(f)}>×</button>
            </li>
          ))}
        </ul>
      )}
      {msg && <p className="muted" role="status">{msg}</p>}
    </div>
  )
}
