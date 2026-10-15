// 24px 선 아이콘 (이모지 대체)
const PATHS: Record<string, string> = {
  home: 'M3 11l9-7 9 7M5 10v10h5v-6h4v6h5V10',
  grid: 'M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z',
  list: 'M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01',
  settings: 'M12 15a3 3 0 100-6 3 3 0 000 6zM19 12l2-1-1-3-2 .2-1.3-1.3L17 5l-3-1-1 2h-2L10 4 7 5l.3 1.9L6 8.2 4 8l-1 3 2 1v0l-2 1 1 3 2-.2 1.3 1.3L7 19l3 1 1-2h2l1 2 3-1-.3-1.9 1.3-1.3 2 .2 1-3z',
  roulette: 'M12 3a9 9 0 110 18 9 9 0 010-18zM12 3v18M3 12h18M5.6 5.6l12.8 12.8M18.4 5.6L5.6 18.4',
  cards: 'M4 6h10v14H4zM8 3h12v14',
  ladder: 'M7 3v18M17 3v18M7 7h10M7 12h10M7 17h10',
  bomb: 'M11 21a7 7 0 100-14 7 7 0 000 14zM14 8l2-2M17 3l1 1M20 5l-1 1M16 6l2-2',
  flag: 'M5 21V4M5 4h12l-2 4 2 4H5',
  hash: 'M5 9h14M5 15h14M10 4L8 20M16 4l-2 16',
  zap: 'M13 2L4 14h7l-1 8 9-12h-7z',
  shuffle: 'M4 7h3l10 10h3M4 17h3l3-3M14 10l3-3h3M18 4l3 3-3 3M18 14l3 3-3 3',
}

export default function Icon({ name, size = 24 }: { name: string; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={PATHS[name] ?? ''} />
    </svg>
  )
}
