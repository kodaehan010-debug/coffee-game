import { describe, expect, it } from 'vitest'
import { matches, setMany, toggle } from './selection'

describe('selection', () => {
  it('toggle 추가·제거·중복·최대', () => {
    expect(toggle([], 'A', true)).toEqual(['A'])
    expect(toggle(['A'], 'A', true)).toEqual(['A'])
    expect(toggle(['A', 'B'], 'A', false)).toEqual(['B'])
    expect(toggle(['A', 'B'], 'C', true, 2)).toEqual(['A', 'B'])
  })
  it('setMany 남은 자리만 추가', () => {
    expect(setMany(['A'], ['A', 'B', 'C'], true, 2)).toEqual(['A', 'B'])
    expect(setMany(['A', 'B', 'C'], ['A', 'C'], false)).toEqual(['B'])
  })
  it('matches 공백·대소문자 무시', () => {
    expect(matches('Kim Ab', 'kima')).toBe(true)
    expect(matches('Kim', 'x')).toBe(false)
  })
})
