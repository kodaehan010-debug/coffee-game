import type { ComponentType } from 'react'
import Bomb from './Bomb'
import Ladder from './Ladder'
import Lots from './Lots'
import Race from './Race'
import Reaction from './Reaction'
import Roulette from './Roulette'
import UpDown from './UpDown'

/** 모든 게임 공통 규칙: 참가자 목록 입력 → onFinish(당첨자) */
export type GameProps = {
  players: string[]
  winners: number
  sound: boolean
  /** 당첨 보정 가중치 (과거 당첨 많을수록 낮음). 룰렛·제비뽑기·폭탄에서 사용 */
  weight: (name: string) => number
  onFinish: (winners: string[]) => void
}

export type GameDef = { id: string; name: string; icon: string; desc: string; Component: ComponentType<GameProps> }

export const GAMES: GameDef[] = [
  { id: 'roulette', name: '룰렛', icon: 'roulette', desc: '원판을 돌려 멈춘 칸이 당첨', Component: Roulette },
  { id: 'lots', name: '제비뽑기', icon: 'cards', desc: '카드를 뒤집어 당첨 확인', Component: Lots },
  { id: 'ladder', name: '사다리타기', icon: 'ladder', desc: '줄을 따라 내려가 당첨 칸 확인', Component: Ladder },
  { id: 'bomb', name: '폭탄 돌리기', icon: 'bomb', desc: '터지는 순간 들고 있는 사람 당첨', Component: Bomb },
  { id: 'race', name: '경마', icon: 'flag', desc: '랜덤 경주, 늦게 들어온 사람 당첨', Component: Race },
  { id: 'updown', name: '숫자 업다운', icon: 'hash', desc: '1~100 비밀 숫자를 맞히면 당첨', Component: UpDown },
  { id: 'reaction', name: '반응속도', icon: 'zap', desc: '신호 후 클릭, 가장 느린 사람 당첨 (실력 게임)', Component: Reaction },
]
