// 귀여운 플랫 스타일 말 (오른쪽을 바라봄, 코끝 = SVG 오른쪽 끝)
type Props = { color: string; running: boolean }

export default function Horse({ color, running }: Props) {
  return (
    <svg className={`horse${running ? ' running' : ''}`} viewBox="0 0 48 32" aria-hidden="true">
      <g className="horse-body">
        {/* 꼬리 */}
        <path d="M9 13 Q2 12 3 20" stroke="#5b4636" strokeWidth="2.5" fill="none" strokeLinecap="round" />
        {/* 몸통 */}
        <ellipse cx="20" cy="16" rx="12" ry="7" fill={color} />
        {/* 목 + 머리 */}
        <path d="M28 14 L34 5 Q37 3 40 5 L47 11 Q48 14 45 15 L38 14 L32 19 Z" fill={color} />
        {/* 갈기 */}
        <path d="M30 11 L34 4 L36 6 L32 13 Z" fill="#5b4636" />
        {/* 귀 */}
        <path d="M36 4 L37 0 L39 4 Z" fill={color} />
        {/* 눈 */}
        <circle cx="40" cy="8" r="1.3" fill="#2b2b2b" />
        {/* 볼터치 */}
        <circle cx="42" cy="12" r="1.4" fill="#f4a3a3" opacity="0.8" />
      </g>
      {/* 다리 4개 (앞/뒤 교차) */}
      <g stroke={color} strokeWidth="3" strokeLinecap="round">
        <line className="leg leg-a" x1="12" y1="20" x2="12" y2="30" />
        <line className="leg leg-b" x1="16" y1="20" x2="16" y2="30" />
        <line className="leg leg-b" x1="25" y1="20" x2="25" y2="30" />
        <line className="leg leg-a" x1="29" y1="20" x2="29" y2="30" />
      </g>
    </svg>
  )
}
