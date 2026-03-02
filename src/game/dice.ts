// src/game/dice.ts

export function rollDice(): number[] {
  return Array.from({ length: 4 }, () => Math.floor(Math.random() * 6) + 1)
}

export function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}
