// src/game/scoring.test.ts
import { describe, it, expect } from 'vitest'
import { calculateScore } from './scoring'
import type { ScoreResult } from './scoring'

describe('calculateScore', () => {
  it('scores sum of non-pair dice when one pair exists', () => {
    // Pair of 3s, others are 5 and 2 → score = 7
    expect(calculateScore([3, 3, 5, 2])).toEqual<ScoreResult>({ score: 7, pig: false, loseByOnes: false })
  })

  it('scores 12 for max hand (pair + two 6s)', () => {
    expect(calculateScore([4, 4, 6, 6])).toEqual<ScoreResult>({ score: 12, pig: false, loseByOnes: false })
  })

  it('returns 0 (pig) when no pair', () => {
    expect(calculateScore([1, 2, 3, 4])).toEqual<ScoreResult>({ score: 0, pig: true, loseByOnes: false })
  })

  it('returns loseByOnes when pair of 1s', () => {
    expect(calculateScore([1, 1, 4, 5])).toEqual<ScoreResult>({ score: 0, pig: false, loseByOnes: true })
  })

  it('handles three of a kind correctly', () => {
    // [3,3,3,5] → sorted [3,3,3,5] → first pair at index 0 (3,3), remaining [3,5] → sum = 8
    expect(calculateScore([3, 3, 3, 5])).toEqual<ScoreResult>({ score: 8, pig: false, loseByOnes: false })
  })

  it('handles four of a kind — score is 12 (max)', () => {
    expect(calculateScore([5, 5, 5, 5])).toEqual<ScoreResult>({ score: 12, pig: false, loseByOnes: false })
  })
})
