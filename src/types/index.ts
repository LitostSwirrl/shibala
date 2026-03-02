// src/types/index.ts

export interface PlayerInRoom {
  nickname: string
  score: number         // total wins this game
  dice: number[]        // current roll [1-6, 1-6, 1-6, 1-6]
  rolled: boolean       // has rolled this round
  ready: boolean        // ready to start
}

export interface RoundResult {
  scores: Record<string, number>  // uid -> score
  winner: string
}

export type RoomStatus = 'waiting' | 'playing' | 'finished'

export interface Room {
  status: RoomStatus
  hostUid: string
  round: number
  maxRounds: 1 | 3 | 5
  currentTurn: string    // uid
  players: Record<string, PlayerInRoom>
  roundResults: Record<string, RoundResult>
  createdAt: number
}

export interface PlayerStats {
  nickname: string
  gamesPlayed: number
  wins: number
  losses: number
  highScore: number
  seasonKey: string
}

export interface LeaderboardEntry {
  nickname: string
  wins: number
  winRate: number
}

export type Screen = 'home' | 'lobby' | 'game' | 'leaderboard'

export interface ScoreResult {
  score: number
  pig: boolean        // no pair = 豬頭
  loseByOnes: boolean // pair of 1s = instant lose
}
