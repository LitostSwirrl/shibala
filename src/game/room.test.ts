// src/game/room.test.ts
import { describe, it, expect } from 'vitest'
import { getRoundWinner, isGameOver, getCurrentSeason } from './room'
import type { Room } from '../types'

const baseRoom: Room = {
  status: 'playing',
  hostUid: 'uid1',
  round: 1,
  maxRounds: 3,
  currentTurn: 'uid1',
  players: {
    uid1: { nickname: 'A', score: 0, dice: [], rolled: true, ready: true },
    uid2: { nickname: 'B', score: 0, dice: [], rolled: true, ready: true },
  },
  roundResults: {},
  createdAt: 0,
}

describe('getRoundWinner', () => {
  it('returns uid of highest scorer', () => {
    expect(getRoundWinner({ uid1: 10, uid2: 7 })).toBe('uid1')
  })
  it('returns empty string on tie', () => {
    expect(getRoundWinner({ uid1: 8, uid2: 8 })).toBe('')
  })
  it('loseByOnes (-1) loses to positive score', () => {
    expect(getRoundWinner({ uid1: -1, uid2: 5 })).toBe('uid2')
  })
  it('returns empty string if all have -1 (all loseByOnes)', () => {
    expect(getRoundWinner({ uid1: -1, uid2: -1 })).toBe('')
  })
})

describe('isGameOver', () => {
  it('returns false when rounds remain', () => {
    expect(isGameOver({ ...baseRoom, round: 2, maxRounds: 3 })).toBe(false)
  })
  it('returns true when current round equals maxRounds', () => {
    expect(isGameOver({ ...baseRoom, round: 3, maxRounds: 3 })).toBe(true)
  })
  it('returns true when round exceeds maxRounds', () => {
    expect(isGameOver({ ...baseRoom, round: 5, maxRounds: 3 })).toBe(true)
  })
})

describe('getCurrentSeason', () => {
  it('returns YYYY-QN format', () => {
    expect(getCurrentSeason(new Date('2026-03-03'))).toBe('2026-Q1')
    expect(getCurrentSeason(new Date('2026-06-15'))).toBe('2026-Q2')
    expect(getCurrentSeason(new Date('2026-09-01'))).toBe('2026-Q3')
    expect(getCurrentSeason(new Date('2026-12-31'))).toBe('2026-Q4')
  })
})
