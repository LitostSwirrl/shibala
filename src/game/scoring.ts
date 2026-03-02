// src/game/scoring.ts

import type { ScoreResult } from '../types'
export type { ScoreResult }  // re-export so existing test imports still work

export function calculateScore(dice: number[]): ScoreResult {
  // Four of a kind = max score
  if (new Set(dice).size === 1) {
    return { score: 12, pig: false, loseByOnes: false }
  }

  const sorted = [...dice].sort((a, b) => a - b)
  const pairIndex = findPairIndex(sorted)

  if (pairIndex === -1) {
    return { score: 0, pig: true, loseByOnes: false }
  }

  const pairValue = sorted[pairIndex]

  if (pairValue === 1) {
    return { score: 0, pig: false, loseByOnes: true }
  }

  const remaining = [...sorted]
  remaining.splice(pairIndex, 2)
  const score = remaining.reduce((sum, d) => sum + d, 0)

  return { score, pig: false, loseByOnes: false }
}

function findPairIndex(sorted: number[]): number {
  for (let i = 0; i < sorted.length - 1; i++) {
    if (sorted[i] === sorted[i + 1]) return i
  }
  return -1
}
