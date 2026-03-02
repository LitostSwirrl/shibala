// src/game/room.ts
import type { Room } from '../types'

// scores: uid -> round score. -1 = loseByOnes (automatic loss)
export function getRoundWinner(scores: Record<string, number>): string {
  const entries = Object.entries(scores)
  if (entries.length === 0) return ''

  const valid = entries.filter(([, s]) => s !== -1)
  if (valid.length === 0) return ''  // all lost by ones = tie

  const max = Math.max(...valid.map(([, s]) => s))
  const top = valid.filter(([, s]) => s === max)

  return top.length === 1 ? top[0][0] : ''
}

export function isGameOver(room: Room): boolean {
  return room.round >= room.maxRounds
}

export function getCurrentSeason(date: Date = new Date()): string {
  const year = date.getFullYear()
  const quarter = Math.floor(date.getMonth() / 3) + 1
  return `${year}-Q${quarter}`
}
