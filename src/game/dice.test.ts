// src/game/dice.test.ts
import { describe, it, expect } from 'vitest'
import { rollDice, generateRoomCode } from './dice'

describe('rollDice', () => {
  it('returns 4 numbers', () => {
    expect(rollDice()).toHaveLength(4)
  })
  it('all values between 1 and 6', () => {
    for (let i = 0; i < 200; i++) {
      rollDice().forEach(d => {
        expect(d).toBeGreaterThanOrEqual(1)
        expect(d).toBeLessThanOrEqual(6)
      })
    }
  })
})

describe('generateRoomCode', () => {
  it('returns 6-char alphanumeric string', () => {
    const code = generateRoomCode()
    expect(code).toHaveLength(6)
    expect(code).toMatch(/^[A-Z0-9]{6}$/)
  })
  it('generates different codes', () => {
    const codes = new Set(Array.from({ length: 10 }, generateRoomCode))
    expect(codes.size).toBeGreaterThan(1)
  })
})
