// 조추첨 ① 추첨 명단: 참가자 선택
import { useNavigate } from 'react-router-dom'
import Favorites from '../../components/Favorites'
import RosterPicker from '../../components/RosterPicker'
import { useDrawState } from './drawState'

export default function DrawRoster() {
  const [s, update] = useDrawState()
  const navigate = useNavigate()
  const n = s.selected.length
  return (
    <section className="td">
      <h2>추첨 명단 <span className="muted tnum">{n}명</span></h2>
      <Favorites selected={s.selected} onLoad={(selected) => update({ selected })} />
      <RosterPicker selected={s.selected} onChange={(selected) => update({ selected })} rosterLink="/draw/settings" />
      <div className="row td-actions">
        {n > 0 && <button className="link" onClick={() => update({ selected: [] })}>전체 비우기</button>}
        <button className="primary big" disabled={n < 2} onClick={() => navigate('/draw/setup')}>다음: 추첨 설정</button>
      </div>
      {n < 2 && <p className="muted">2명 이상 선택하세요.</p>}
    </section>
  )
}
