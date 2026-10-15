import { Link } from 'react-router-dom'
import { useAppState } from '../AppState'
import { beep } from '../lib/sound'

export default function Settings() {
  const { settings, setSettings } = useAppState()

  return (
    <section>
      <h2>설정</h2>
      <label className="row center">
        <input
          type="checkbox"
          checked={settings.sound}
          onChange={(e) => {
            setSettings({ ...settings, sound: e.target.checked })
            beep(880, 80, e.target.checked)
          }}
        />
        효과음 켜기
      </label>
      <h3>명단</h3>
      <p><Link className="btn" to="/settings/roster">명단 관리 (추가·삭제·엑셀)</Link></p>
      <p className="muted">기록은 이 PC의 브라우저에만 저장됩니다. 백업은 [기록] 화면의 내보내기를 이용하세요.</p>
    </section>
  )
}
