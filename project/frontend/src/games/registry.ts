import type { ComponentType } from 'react'
import Bomb from './Bomb'
import Ladder from './Ladder'
import Lots from './Lots'
import Roulette from './Roulette'

/** 모든 게임 공통 규칙: 참가자 목록 입력 → onFinish(당첨자) */
export type GameProps = {
  players: string[]
  winners: number
  sound: boolean
  onFinish: (winners: string[]) => void
}

export type GameDef = { id: string; name: string; emoji: string; desc: string; Component: ComponentType<GameProps> }

export const GAMES: GameDef[] = [
  { id: 'roulette', name: '룰렛', emoji: '🎡', desc: '원판을 돌려 멈춘 칸이 당첨', Component: Roulette },
  { id: 'lots', name: '제비뽑기', emoji: '🃏', desc: '카드를 뒤집어 당첨 확인', Component: Lots },
  { id: 'ladder', name: '사다리타기', emoji: '🪜', desc: '줄을 따라 내려가 당첨 칸 확인', Component: Ladder },
  { id: 'bomb', name: '폭탄 돌리기', emoji: '💣', desc: '터지는 순간 들고 있는 사람 당첨', Component: Bomb },
]
