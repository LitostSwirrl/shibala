# 十八啦 Online Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a real-time multiplayer 十八啦 dice game with anonymous login, 2–6 player rooms, and global + seasonal leaderboards, hosted on GitHub Pages.

**Architecture:** React + TypeScript + Vite frontend hosted on GitHub Pages. Firebase Realtime Database for live room state sync and leaderboards. Firebase Anonymous Auth for zero-friction login. Game logic (dice rolling, scoring) is pure TypeScript — no server needed.

**Tech Stack:** React 18, TypeScript 5, Vite, Tailwind CSS, Framer Motion, Firebase 10 (RTDB + Anonymous Auth), Vitest, GitHub Pages (`gh-pages` branch)

---

## Prerequisites

- Node.js 20+
- A Firebase project created at console.firebase.google.com with:
  - Realtime Database enabled (start in test mode for dev)
  - Anonymous Auth enabled
- `VITE_FIREBASE_*` env vars ready (see Task 2)

---

### Task 1: Scaffold Project

**Files:**
- Create: `package.json`, `vite.config.ts`, `tsconfig.json`, `index.html`
- Create: `src/main.tsx`, `src/App.tsx`
- Create: `tailwind.config.ts`, `postcss.config.js`
- Create: `.env.local` (gitignored), `.env.example`
- Create: `.gitignore`

**Step 1: Scaffold Vite project**

```bash
cd /Users/jinsoon/Sites/shibala
npm create vite@latest . -- --template react-ts
npm install
```

**Step 2: Install dependencies**

```bash
npm install firebase framer-motion
npm install -D tailwindcss postcss autoprefixer vitest @vitest/ui jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event gh-pages
npx tailwindcss init -p
```

**Step 3: Configure Tailwind**

Edit `tailwind.config.ts`:
```ts
import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        festive: {
          red: '#DC2626',
          gold: '#D97706',
          darkred: '#991B1B',
          cream: '#FEF3C7',
        }
      },
      fontFamily: {
        game: ['"Noto Sans TC"', 'sans-serif'],
      }
    },
  },
  plugins: [],
} satisfies Config
```

**Step 4: Configure Vite for GitHub Pages**

Edit `vite.config.ts`:
```ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/shibala/',
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    globals: true,
  },
})
```

**Step 5: Create test setup**

Create `src/test/setup.ts`:
```ts
import '@testing-library/jest-dom'
```

**Step 6: Add scripts to package.json**

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "test": "vitest",
    "test:ui": "vitest --ui",
    "deploy": "npm run build && gh-pages -d dist",
    "preview": "vite preview"
  },
  "homepage": "https://<your-github-username>.github.io/shibala"
}
```

**Step 7: Create .gitignore**

```
node_modules/
dist/
.env.local
*.env
```

**Step 8: Create .env.example**

```
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_DATABASE_URL=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
```

**Step 9: Commit**

```bash
git add -A
git commit -m "feat: scaffold Vite + React + TS + Tailwind project"
```

---

### Task 2: Firebase Initialization

**Files:**
- Create: `src/lib/firebase.ts`
- Create: `src/lib/rtdb.ts`

**Step 1: Create firebase.ts**

```ts
// src/lib/firebase.ts
import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getDatabase } from 'firebase/database'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

export const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const db = getDatabase(app)
```

**Step 2: Create rtdb.ts with typed RTDB paths**

```ts
// src/lib/rtdb.ts
import { ref, set, get, update, onValue, push, remove, query, orderByChild, limitToLast } from 'firebase/database'
import { db } from './firebase'
import type { Room, PlayerStats, LeaderboardEntry } from '../types'

export const roomRef = (roomId: string) => ref(db, `rooms/${roomId}`)
export const playerRef = (uid: string) => ref(db, `players/${uid}`)
export const leaderboardRef = (key: 'alltime' | string) => ref(db, `leaderboard/${key}`)
export const topLeaderboardQuery = (key: string) =>
  query(leaderboardRef(key), orderByChild('wins'), limitToLast(20))

export { ref, set, get, update, onValue, push, remove }
```

**Step 3: Commit**

```bash
git add src/lib/
git commit -m "feat: initialize Firebase RTDB and auth"
```

---

### Task 3: TypeScript Types

**Files:**
- Create: `src/types/index.ts`

**Step 1: Write types**

```ts
// src/types/index.ts

export interface PlayerInRoom {
  nickname: string
  score: number         // total wins this game
  dice: number[]        // current roll [1-6, 1-6, 1-6, 1-6]
  rolled: boolean       // has rolled this round
  ready: boolean        // ready to start
}

export interface RoundResult {
  [uid: string]: number  // uid -> round score
  winner: string         // uid of winner (empty string = tie/re-roll)
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
```

**Step 2: Commit**

```bash
git add src/types/
git commit -m "feat: add TypeScript types for game domain"
```

---

### Task 4: Game Logic (Pure Functions, TDD)

**Files:**
- Create: `src/game/dice.ts`
- Create: `src/game/dice.test.ts`
- Create: `src/game/scoring.ts`
- Create: `src/game/scoring.test.ts`
- Create: `src/game/room.ts`
- Create: `src/game/room.test.ts`

**Step 1: Write failing tests for dice**

Create `src/game/dice.test.ts`:
```ts
import { describe, it, expect, vi } from 'vitest'
import { rollDice, generateRoomCode } from './dice'

describe('rollDice', () => {
  it('returns 4 numbers', () => {
    expect(rollDice()).toHaveLength(4)
  })
  it('all values between 1 and 6', () => {
    const roll = rollDice()
    roll.forEach(d => {
      expect(d).toBeGreaterThanOrEqual(1)
      expect(d).toBeLessThanOrEqual(6)
    })
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
```

**Step 2: Run test — expect FAIL**

```bash
npx vitest run src/game/dice.test.ts
```
Expected: FAIL — "Cannot find module './dice'"

**Step 3: Implement dice.ts**

```ts
// src/game/dice.ts
export function rollDice(): number[] {
  return Array.from({ length: 4 }, () => Math.floor(Math.random() * 6) + 1)
}

export function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}
```

**Step 4: Run test — expect PASS**

```bash
npx vitest run src/game/dice.test.ts
```
Expected: PASS (2 suites, 4 tests)

**Step 5: Write failing tests for scoring**

Create `src/game/scoring.test.ts`:
```ts
import { describe, it, expect } from 'vitest'
import { calculateScore, ScoreResult } from './scoring'

describe('calculateScore', () => {
  it('returns sum of non-pair dice when one pair exists', () => {
    // Pair of 3s, others are 5 and 2 → score = 7
    expect(calculateScore([3, 3, 5, 2])).toEqual<ScoreResult>({ score: 7, pig: false, loseByOnes: false })
  })

  it('returns 18 for 十八啦 (pair + 6+6 is not valid — pair of anything, others sum to 18)', () => {
    // Pair of 2s, others are 6+6 — wait, max is pair + two 6s = 12. Actually pair of anything + 6+6...
    // Pair of 1s is auto-lose, so: pair of 2s + [6,6] → but 6+6 = 12 not 18
    // 十八啦 = two remaining dice sum to 18 impossible with 2 dice (max 12)
    // Actually re-check rules: some versions use highest value of non-pair...
    // Using most common: score = sum of non-pair two dice, max = 6+6 = 12?
    // OR: 十八啦 special = all 4 dice show different faces summing to 18?
    // Standard rule: pair present → score = other two dice sum. Max possible = 6+6 = 12 unless...
    // Most common Taiwanese rule: 十八啦 = score 18 achieved when you have a pair AND the other two sum to...
    // Actually in the most common variant: pair of 6s + any two dice → special high score
    // Let's use: pair exists → score = sum of remaining 2 (max 12 normally)
    // 十八啦 (18) is a SPECIAL HAND: pair of anything + remaining two dice BOTH 6s? Still only 12.
    // Correct rule: 十八啦 = FOUR OF A KIND (all same) = instant win / special score
    // OR: pair + remaining sum = score, with pair of 6 counting double?
    // Using most common variant for Taiwan: score = sum of non-pair. 十八啦 is marketing name for max.
    // Let's go with: score = sum of non-pair 2 dice. Max = 6+6=12. But game is called 十八 so...
    // CORRECT: in 十八啦, you roll 4 dice, need a PAIR, and the other two show the highest sum.
    // The name "18" because the theoretical max if you add all dice = 6+6+6 (three of a kind gets 12 bonus?)
    // Most playable variant: pair present → score = sum of other 2 dice (0-12).
    // "十八啦" shout = when score is 12 (max possible). Let's use score out of 12, but show 十八啦 at 12.
    expect(calculateScore([4, 4, 6, 6])).toEqual<ScoreResult>({ score: 12, pig: false, loseByOnes: false })
  })

  it('returns 0 (pig) when no pair', () => {
    expect(calculateScore([1, 2, 3, 4])).toEqual<ScoreResult>({ score: 0, pig: true, loseByOnes: false })
  })

  it('returns loseByOnes when pair of 1s', () => {
    expect(calculateScore([1, 1, 4, 5])).toEqual<ScoreResult>({ score: 0, pig: false, loseByOnes: true })
  })

  it('handles three of a kind — uses remaining die as score', () => {
    // [3,3,3,5] → pairs: multiple 3 pairs. Non-pair die = 5? Actually with three 3s:
    // We have one pair (3,3) and the remaining two are (3,5) → sum = 8
    expect(calculateScore([3, 3, 3, 5])).toEqual<ScoreResult>({ score: 8, pig: false, loseByOnes: false })
  })

  it('handles four of a kind — score is 12 (max, 十八啦!)', () => {
    expect(calculateScore([5, 5, 5, 5])).toEqual<ScoreResult>({ score: 12, pig: false, loseByOnes: false })
  })
})
```

**Step 6: Run scoring tests — expect FAIL**

```bash
npx vitest run src/game/scoring.test.ts
```
Expected: FAIL

**Step 7: Implement scoring.ts**

```ts
// src/game/scoring.ts

export interface ScoreResult {
  score: number
  pig: boolean        // no pair = 豬頭
  loseByOnes: boolean // pair of 1s = instant lose
}

export function calculateScore(dice: number[]): ScoreResult {
  const sorted = [...dice].sort((a, b) => a - b)

  // Find a pair
  const pairIndex = findPairIndex(sorted)

  if (pairIndex === -1) {
    return { score: 0, pig: true, loseByOnes: false }
  }

  const pairValue = sorted[pairIndex]

  if (pairValue === 1) {
    return { score: 0, pig: false, loseByOnes: true }
  }

  // Remove the pair, sum the rest
  const remaining = [...sorted]
  remaining.splice(pairIndex, 2)
  const score = remaining.reduce((sum, d) => sum + d, 0)

  // Four of a kind → max score
  if (new Set(dice).size === 1) {
    return { score: 12, pig: false, loseByOnes: false }
  }

  return { score, pig: false, loseByOnes: false }
}

function findPairIndex(sorted: number[]): number {
  for (let i = 0; i < sorted.length - 1; i++) {
    if (sorted[i] === sorted[i + 1]) return i
  }
  return -1
}
```

**Step 8: Run scoring tests — expect PASS**

```bash
npx vitest run src/game/scoring.test.ts
```
Expected: PASS

**Step 9: Write tests for room utilities**

Create `src/game/room.test.ts`:
```ts
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
    expect(getRoundWinner({ uid1: 10, uid2: 7, winner: '' })).toBe('uid1')
  })
  it('returns empty string on tie', () => {
    expect(getRoundWinner({ uid1: 8, uid2: 8, winner: '' })).toBe('')
  })
  it('loseByOnes beats everything (returns other player)', () => {
    expect(getRoundWinner({ uid1: -1, uid2: 5, winner: '' })).toBe('uid2')
  })
})

describe('isGameOver', () => {
  it('returns false when rounds remain', () => {
    expect(isGameOver({ ...baseRoom, round: 2, maxRounds: 3 })).toBe(false)
  })
  it('returns true when current round equals maxRounds', () => {
    expect(isGameOver({ ...baseRoom, round: 3, maxRounds: 3 })).toBe(true)
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
```

**Step 10: Run room tests — expect FAIL**

```bash
npx vitest run src/game/room.test.ts
```

**Step 11: Implement room.ts**

```ts
// src/game/room.ts
import type { Room, RoundResult } from '../types'

// Use -1 as sentinel for "lost by ones"
export function getRoundWinner(results: RoundResult): string {
  const entries = Object.entries(results).filter(([k]) => k !== 'winner')
  if (entries.length === 0) return ''

  const scores = entries as [string, number][]

  // If any player has -1 (loseByOnes), they lose
  const losers = scores.filter(([, s]) => s === -1).map(([uid]) => uid)
  if (losers.length > 0 && losers.length < scores.length) {
    const winners = scores.filter(([, s]) => s !== -1)
    if (winners.length === 1) return winners[0][0]
  }

  const validScores = scores.filter(([, s]) => s !== -1)
  if (validScores.length === 0) return ''

  const max = Math.max(...validScores.map(([, s]) => s))
  const topPlayers = validScores.filter(([, s]) => s === max)

  return topPlayers.length === 1 ? topPlayers[0][0] : ''
}

export function isGameOver(room: Room): boolean {
  return room.round >= room.maxRounds
}

export function getCurrentSeason(date: Date = new Date()): string {
  const year = date.getFullYear()
  const quarter = Math.floor(date.getMonth() / 3) + 1
  return `${year}-Q${quarter}`
}
```

**Step 12: Run all game tests — expect PASS**

```bash
npx vitest run src/game/
```
Expected: All PASS

**Step 13: Commit**

```bash
git add src/game/
git commit -m "feat: implement core game logic with tests (dice, scoring, room)"
```

---

### Task 5: Auth Hook

**Files:**
- Create: `src/hooks/useAuth.ts`

**Step 1: Implement useAuth**

```ts
// src/hooks/useAuth.ts
import { useEffect, useState } from 'react'
import { signInAnonymously, onAuthStateChanged } from 'firebase/auth'
import { auth } from '../lib/firebase'
import { playerRef, set, get } from '../lib/rtdb'
import type { PlayerStats } from '../types'

interface AuthState {
  uid: string | null
  nickname: string | null
  loading: boolean
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({ uid: null, nickname: null, loading: true })

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const snap = await get(playerRef(user.uid))
        const existing = snap.val() as PlayerStats | null
        setState({
          uid: user.uid,
          nickname: existing?.nickname ?? null,
          loading: false,
        })
      } else {
        await signInAnonymously(auth)
      }
    })
    return unsubscribe
  }, [])

  async function setNickname(nickname: string, uid: string) {
    await set(playerRef(uid), {
      nickname,
      gamesPlayed: 0,
      wins: 0,
      losses: 0,
      highScore: 0,
      seasonKey: '',
    } satisfies PlayerStats)
    setState(prev => ({ ...prev, nickname }))
  }

  return { ...state, setNickname }
}
```

**Step 2: Commit**

```bash
git add src/hooks/useAuth.ts
git commit -m "feat: anonymous auth hook with nickname setup"
```

---

### Task 6: Room Hook

**Files:**
- Create: `src/hooks/useRoom.ts`

**Step 1: Implement useRoom**

```ts
// src/hooks/useRoom.ts
import { useEffect, useState } from 'react'
import { roomRef, onValue, set, update, remove } from '../lib/rtdb'
import { generateRoomCode } from '../game/dice'
import { getRoundWinner, isGameOver, getCurrentSeason } from '../game/room'
import { calculateScore } from '../game/scoring'
import { playerRef, leaderboardRef } from '../lib/rtdb'
import { get } from 'firebase/database'
import { db } from '../lib/firebase'
import { ref, update as rtdbUpdate } from 'firebase/database'
import type { Room, PlayerInRoom } from '../types'

export function useRoom(uid: string | null) {
  const [room, setRoom] = useState<Room | null>(null)
  const [roomId, setRoomId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!roomId) return
    const unsubscribe = onValue(roomRef(roomId), (snap) => {
      setRoom(snap.val() as Room | null)
    })
    return unsubscribe
  }, [roomId])

  async function createRoom(nickname: string, maxRounds: 1 | 3 | 5) {
    if (!uid) return
    const id = generateRoomCode()
    const newRoom: Room = {
      status: 'waiting',
      hostUid: uid,
      round: 1,
      maxRounds,
      currentTurn: uid,
      players: {
        [uid]: { nickname, score: 0, dice: [], rolled: false, ready: false },
      },
      roundResults: {},
      createdAt: Date.now(),
    }
    await set(roomRef(id), newRoom)
    setRoomId(id)
    return id
  }

  async function joinRoom(id: string, nickname: string) {
    if (!uid) return
    const snap = await get(roomRef(id))
    const existing = snap.val() as Room | null
    if (!existing) { setError('找不到房間'); return }
    if (existing.status !== 'waiting') { setError('遊戲已開始'); return }
    if (Object.keys(existing.players).length >= 6) { setError('房間已滿'); return }

    await update(roomRef(id), {
      [`players/${uid}`]: { nickname, score: 0, dice: [], rolled: false, ready: false },
    })
    setRoomId(id)
  }

  async function setReady() {
    if (!uid || !roomId) return
    await update(roomRef(roomId), { [`players/${uid}/ready`]: true })
  }

  async function startGame() {
    if (!roomId) return
    await update(roomRef(roomId), { status: 'playing', round: 1 })
  }

  async function roll(dice: number[], nickname: string) {
    if (!uid || !roomId || !room) return
    const result = calculateScore(dice)
    const roundScore = result.loseByOnes ? -1 : result.score

    await update(roomRef(roomId), {
      [`players/${uid}/dice`]: dice,
      [`players/${uid}/rolled`]: true,
      [`roundResults/${room.round}/${uid}`]: roundScore,
    })

    // Check if all players have rolled
    const updatedPlayers = { ...room.players, [uid]: { ...room.players[uid], rolled: true } }
    const allRolled = Object.values(updatedPlayers).every(p => p.rolled)

    if (allRolled && room) {
      const roundResults = { ...(room.roundResults[room.round] ?? {}), [uid]: roundScore }
      const winner = getRoundWinner({ ...roundResults, winner: '' })

      const updates: Record<string, unknown> = {
        [`roundResults/${room.round}/winner`]: winner,
      }

      if (winner) {
        updates[`players/${winner}/score`] = (room.players[winner]?.score ?? 0) + 1
      }

      const gameOver = isGameOver({ ...room, round: room.round })
      if (gameOver) {
        updates['status'] = 'finished'
        await finalizeGame(room, winner, uid, nickname)
      } else {
        // Reset for next round
        updates['round'] = room.round + 1
        Object.keys(room.players).forEach(pid => {
          updates[`players/${pid}/rolled`] = false
          updates[`players/${pid}/dice`] = []
        })
        updates['currentTurn'] = Object.keys(room.players)[0]
      }

      await update(roomRef(roomId), updates)
    }
  }

  async function leaveRoom() {
    if (!uid || !roomId || !room) return
    if (Object.keys(room.players).length === 1) {
      await remove(roomRef(roomId))
    } else {
      await update(roomRef(roomId), { [`players/${uid}`]: null })
    }
    setRoomId(null)
    setRoom(null)
  }

  return { room, roomId, error, createRoom, joinRoom, setReady, startGame, roll, leaveRoom }
}

async function finalizeGame(room: Room, roundWinner: string, myUid: string, myNickname: string) {
  const scores = Object.entries(room.players).map(([uid, p]) => ({ uid, score: p.score }))
  const maxScore = Math.max(...scores.map(s => s.score))
  const gameWinners = scores.filter(s => s.score === maxScore).map(s => s.uid)
  const iWon = gameWinners.includes(myUid)

  const season = getCurrentSeason()
  const playerSnap = await get(playerRef(myUid))
  const stats = playerSnap.val() ?? { nickname: myNickname, gamesPlayed: 0, wins: 0, losses: 0, highScore: 0, seasonKey: season }

  const myMaxDice = Math.max(...Object.values(room.roundResults).map(r => (r[myUid] ?? 0) as number).filter(s => s > 0))

  const updatedStats = {
    ...stats,
    gamesPlayed: stats.gamesPlayed + 1,
    wins: iWon ? stats.wins + 1 : stats.wins,
    losses: iWon ? stats.losses : stats.losses + 1,
    highScore: Math.max(stats.highScore, myMaxDice),
    seasonKey: season,
  }

  const winRate = updatedStats.wins / updatedStats.gamesPlayed

  await rtdbUpdate(ref(db), {
    [`players/${myUid}`]: updatedStats,
    [`leaderboard/alltime/${myUid}`]: { nickname: myNickname, wins: updatedStats.wins, winRate },
    [`leaderboard/${season}/${myUid}`]: { nickname: myNickname, wins: iWon ? (stats.wins + 1) : stats.wins, winRate },
  })
}
```

**Step 2: Commit**

```bash
git add src/hooks/useRoom.ts
git commit -m "feat: room management hook (create, join, roll, finalize)"
```

---

### Task 7: App Router & Global State

**Files:**
- Create: `src/context/GameContext.tsx`
- Modify: `src/App.tsx`
- Modify: `src/main.tsx`

**Step 1: Create GameContext**

```tsx
// src/context/GameContext.tsx
import { createContext, useContext, ReactNode } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useRoom } from '../hooks/useRoom'

type GameContextType = ReturnType<typeof useAuth> & ReturnType<typeof useRoom>

const GameContext = createContext<GameContextType | null>(null)

export function GameProvider({ children }: { children: ReactNode }) {
  const auth = useAuth()
  const room = useRoom(auth.uid)
  return (
    <GameContext.Provider value={{ ...auth, ...room }}>
      {children}
    </GameContext.Provider>
  )
}

export function useGame() {
  const ctx = useContext(GameContext)
  if (!ctx) throw new Error('useGame must be used inside GameProvider')
  return ctx
}
```

**Step 2: Update App.tsx for screen routing**

```tsx
// src/App.tsx
import { useGame } from './context/GameContext'
import { HomeScreen } from './screens/HomeScreen'
import { LobbyScreen } from './screens/LobbyScreen'
import { GameScreen } from './screens/GameScreen'
import { LeaderboardScreen } from './screens/LeaderboardScreen'
import { NicknameModal } from './components/NicknameModal'

export default function App() {
  const { loading, nickname, uid, room, roomId } = useGame()

  if (loading) return (
    <div className="min-h-screen bg-festive-red flex items-center justify-center">
      <p className="text-festive-gold text-2xl animate-pulse font-game">載入中...</p>
    </div>
  )

  if (!nickname && uid) return <NicknameModal />

  if (room?.status === 'waiting' && roomId) return <LobbyScreen />
  if ((room?.status === 'playing' || room?.status === 'finished') && roomId) return <GameScreen />

  return <HomeScreen />
}
```

**Step 3: Update main.tsx**

```tsx
// src/main.tsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import { GameProvider } from './context/GameContext'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <GameProvider>
      <App />
    </GameProvider>
  </React.StrictMode>
)
```

**Step 4: Commit**

```bash
git add src/context/ src/App.tsx src/main.tsx
git commit -m "feat: add GameContext and screen routing"
```

---

### Task 8: UI Components — NicknameModal & Home Screen

**Files:**
- Create: `src/components/NicknameModal.tsx`
- Create: `src/screens/HomeScreen.tsx`
- Modify: `src/index.css` (import Google Font)

**Step 1: Add Google Font to index.html**

Add inside `<head>` in `index.html`:
```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@400;700;900&display=swap" rel="stylesheet">
```

**Step 2: Update index.css**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

body {
  font-family: 'Noto Sans TC', sans-serif;
  background-color: #DC2626;
  min-height: 100vh;
}
```

**Step 3: Create NicknameModal**

```tsx
// src/components/NicknameModal.tsx
import { useState } from 'react'
import { useGame } from '../context/GameContext'

export function NicknameModal() {
  const { uid, setNickname } = useGame()
  const [value, setValue] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = value.trim()
    if (!trimmed || !uid) return
    setLoading(true)
    await setNickname(trimmed, uid)
  }

  return (
    <div className="min-h-screen bg-festive-red flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-8 w-full max-w-sm shadow-2xl border-4 border-festive-gold">
        <h1 className="text-3xl font-black text-center text-festive-red mb-2">🎲 十八啦!</h1>
        <p className="text-center text-gray-500 mb-6">請輸入你的暱稱</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            className="w-full border-2 border-festive-gold rounded-lg px-4 py-3 text-lg font-bold text-center focus:outline-none focus:ring-2 focus:ring-festive-red"
            placeholder="骰神、賭聖..."
            value={value}
            onChange={e => setValue(e.target.value)}
            maxLength={12}
            autoFocus
          />
          <button
            type="submit"
            disabled={!value.trim() || loading}
            className="w-full bg-festive-red text-white font-black text-xl py-3 rounded-xl hover:bg-festive-darkred disabled:opacity-50 transition-colors"
          >
            {loading ? '儲存中...' : '進入!'}
          </button>
        </form>
      </div>
    </div>
  )
}
```

**Step 4: Create HomeScreen**

```tsx
// src/screens/HomeScreen.tsx
import { useState } from 'react'
import { useGame } from '../context/GameContext'

export function HomeScreen() {
  const { nickname, uid, createRoom, joinRoom, error } = useGame()
  const [joinCode, setJoinCode] = useState('')
  const [maxRounds, setMaxRounds] = useState<1 | 3 | 5>(3)
  const [showLeaderboard, setShowLeaderboard] = useState(false)
  const [joining, setJoining] = useState(false)

  async function handleCreate() {
    if (!nickname) return
    await createRoom(nickname, maxRounds)
  }

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault()
    if (!nickname || !joinCode.trim()) return
    setJoining(true)
    await joinRoom(joinCode.trim().toUpperCase(), nickname)
    setJoining(false)
  }

  if (showLeaderboard) {
    // Lazy import to keep this file lean
    const { LeaderboardScreen } = require('./LeaderboardScreen')
    return <LeaderboardScreen onBack={() => setShowLeaderboard(false)} />
  }

  return (
    <div className="min-h-screen bg-festive-red flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-4">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-5xl font-black text-festive-gold drop-shadow-lg">🎲 十八啦!</h1>
          <p className="text-white/80 mt-1">你好，{nickname} 👋</p>
        </div>

        {error && (
          <div className="bg-white/20 text-white rounded-xl px-4 py-2 text-center">{error}</div>
        )}

        {/* Create room */}
        <div className="bg-white/10 rounded-2xl p-4 space-y-3">
          <p className="text-festive-gold font-bold">開新房</p>
          <div className="flex gap-2">
            {([1, 3, 5] as const).map(n => (
              <button
                key={n}
                onClick={() => setMaxRounds(n)}
                className={`flex-1 py-2 rounded-lg font-bold transition-colors ${maxRounds === n ? 'bg-festive-gold text-white' : 'bg-white/20 text-white'}`}
              >
                {n} 局
              </button>
            ))}
          </div>
          <button
            onClick={handleCreate}
            className="w-full bg-festive-gold text-white font-black text-xl py-3 rounded-xl hover:opacity-90 transition-opacity"
          >
            開房間
          </button>
        </div>

        {/* Join room */}
        <form onSubmit={handleJoin} className="bg-white/10 rounded-2xl p-4 space-y-3">
          <p className="text-festive-gold font-bold">加入房間</p>
          <input
            className="w-full bg-white/20 text-white placeholder-white/50 rounded-lg px-4 py-3 font-bold text-center text-lg uppercase focus:outline-none focus:ring-2 focus:ring-festive-gold"
            placeholder="輸入房間代碼"
            value={joinCode}
            onChange={e => setJoinCode(e.target.value)}
            maxLength={6}
          />
          <button
            type="submit"
            disabled={!joinCode.trim() || joining}
            className="w-full bg-white text-festive-red font-black text-xl py-3 rounded-xl hover:bg-festive-cream disabled:opacity-50 transition-colors"
          >
            {joining ? '加入中...' : '加入!'}
          </button>
        </form>

        {/* Leaderboard */}
        <button
          onClick={() => setShowLeaderboard(true)}
          className="w-full text-white/70 hover:text-white py-2 text-center transition-colors"
        >
          🏆 排行榜
        </button>
      </div>
    </div>
  )
}
```

**Step 5: Commit**

```bash
git add src/components/ src/screens/HomeScreen.tsx src/index.css index.html
git commit -m "feat: nickname modal and home screen UI"
```

---

### Task 9: Lobby Screen

**Files:**
- Create: `src/screens/LobbyScreen.tsx`

**Step 1: Implement LobbyScreen**

```tsx
// src/screens/LobbyScreen.tsx
import { useGame } from '../context/GameContext'

export function LobbyScreen() {
  const { room, roomId, uid, setReady, startGame, leaveRoom } = useGame()
  if (!room || !roomId) return null

  const players = Object.entries(room.players)
  const allReady = players.every(([, p]) => p.ready)
  const isHost = room.hostUid === uid
  const myPlayer = uid ? room.players[uid] : null

  return (
    <div className="min-h-screen bg-festive-red flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-4">
        <div className="text-center">
          <h2 className="text-3xl font-black text-festive-gold">等待室</h2>
          <p className="text-white mt-1">房間代碼</p>
          <div className="bg-festive-gold text-white font-black text-4xl tracking-widest py-2 px-6 rounded-2xl inline-block mt-1">
            {roomId}
          </div>
        </div>

        <div className="bg-white/10 rounded-2xl p-4 space-y-2">
          <p className="text-festive-gold font-bold">{players.length}/6 玩家</p>
          {players.map(([pid, player]) => (
            <div key={pid} className="flex items-center justify-between bg-white/10 rounded-xl px-4 py-2">
              <span className="text-white font-bold">
                {player.nickname} {pid === room.hostUid ? '👑' : ''}
              </span>
              <span>{player.ready ? '✅ 準備好' : '⏳ 等待中'}</span>
            </div>
          ))}
        </div>

        {!myPlayer?.ready && (
          <button
            onClick={setReady}
            className="w-full bg-white text-festive-red font-black text-xl py-3 rounded-xl"
          >
            我準備好了!
          </button>
        )}

        {isHost && allReady && players.length >= 2 && (
          <button
            onClick={startGame}
            className="w-full bg-festive-gold text-white font-black text-xl py-3 rounded-xl animate-bounce"
          >
            開始遊戲! 🎲
          </button>
        )}

        <button onClick={leaveRoom} className="w-full text-white/50 hover:text-white text-center py-2">
          離開房間
        </button>
      </div>
    </div>
  )
}
```

**Step 2: Commit**

```bash
git add src/screens/LobbyScreen.tsx
git commit -m "feat: lobby screen with room code display and ready system"
```

---

### Task 10: Dice Animation Component

**Files:**
- Create: `src/components/DiceDisplay.tsx`

**Step 1: Implement animated dice**

```tsx
// src/components/DiceDisplay.tsx
import { motion, AnimatePresence } from 'framer-motion'

const DICE_FACES: Record<number, string> = {
  1: '⚀', 2: '⚁', 3: '⚂', 4: '⚃', 5: '⚄', 6: '⚅'
}

interface DiceDisplayProps {
  dice: number[]
  rolling?: boolean
}

export function DiceDisplay({ dice, rolling = false }: DiceDisplayProps) {
  return (
    <div className="flex gap-2 justify-center">
      {dice.map((d, i) => (
        <motion.div
          key={i}
          className="w-14 h-14 bg-white rounded-xl flex items-center justify-center text-4xl shadow-lg"
          animate={rolling ? {
            rotate: [0, 180, 360, 540, 720],
            scale: [1, 1.2, 0.9, 1.1, 1],
          } : { rotate: 0, scale: 1 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        >
          {DICE_FACES[d] ?? '🎲'}
        </motion.div>
      ))}
      {dice.length === 0 && Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center text-3xl">
          🎲
        </div>
      ))}
    </div>
  )
}
```

**Step 2: Commit**

```bash
git add src/components/DiceDisplay.tsx
git commit -m "feat: animated dice display component"
```

---

### Task 11: Game Screen

**Files:**
- Create: `src/screens/GameScreen.tsx`

**Step 1: Implement GameScreen**

```tsx
// src/screens/GameScreen.tsx
import { useState } from 'react'
import { motion } from 'framer-motion'
import { useGame } from '../context/GameContext'
import { DiceDisplay } from '../components/DiceDisplay'
import { rollDice } from '../game/dice'
import { calculateScore } from '../game/scoring'

export function GameScreen() {
  const { room, uid, nickname, roll, leaveRoom } = useGame()
  const [rolling, setRolling] = useState(false)

  if (!room || !uid) return null

  const players = Object.entries(room.players)
  const isMyTurn = room.currentTurn === uid
  const myPlayer = room.players[uid]
  const hasRolled = myPlayer?.rolled ?? false
  const isFinished = room.status === 'finished'

  async function handleRoll() {
    if (hasRolled || rolling) return
    setRolling(true)
    const dice = rollDice()
    await new Promise(r => setTimeout(r, 900)) // wait for animation
    await roll(dice, nickname ?? '??')
    setRolling(false)
  }

  const gameWinner = isFinished
    ? Object.entries(room.players).sort((a, b) => b[1].score - a[1].score)[0]
    : null

  return (
    <div className="min-h-screen bg-festive-red flex flex-col items-center p-4 pt-8">
      <div className="w-full max-w-sm space-y-4">
        {/* Header */}
        <div className="text-center">
          <h2 className="text-festive-gold font-black text-2xl">
            {isFinished ? '遊戲結束!' : `第 ${room.round} / ${room.maxRounds} 局`}
          </h2>
        </div>

        {/* Game over winner */}
        {isFinished && gameWinner && (
          <motion.div
            initial={{ scale: 0 }} animate={{ scale: 1 }}
            className="bg-festive-gold text-white text-center rounded-2xl p-4 font-black text-2xl"
          >
            🏆 {gameWinner[1].nickname} 獲勝!
          </motion.div>
        )}

        {/* Players */}
        <div className="space-y-3">
          {players.map(([pid, player]) => {
            const isMe = pid === uid
            const result = player.dice.length > 0 ? calculateScore(player.dice) : null
            return (
              <div
                key={pid}
                className={`rounded-2xl p-4 space-y-2 ${isMe ? 'bg-white/20 border-2 border-festive-gold' : 'bg-white/10'}`}
              >
                <div className="flex justify-between items-center">
                  <span className="text-white font-bold">
                    {player.nickname} {isMe ? '(我)' : ''} {pid === room.hostUid ? '👑' : ''}
                  </span>
                  <span className="text-festive-gold font-black">
                    {player.score} 勝
                  </span>
                </div>
                <DiceDisplay dice={player.dice} rolling={isMe && rolling} />
                {result && (
                  <div className="text-center font-bold">
                    {result.loseByOnes && <span className="text-red-300">一一！負了！💀</span>}
                    {result.pig && <span className="text-orange-300">豬頭！😤</span>}
                    {!result.pig && !result.loseByOnes && (
                      <span className={result.score === 12 ? 'text-festive-gold text-xl' : 'text-white'}>
                        {result.score === 12 ? '🎉 十八啦！！' : `得 ${result.score} 分`}
                      </span>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Roll button */}
        {!isFinished && !hasRolled && (
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleRoll}
            disabled={rolling}
            className="w-full bg-festive-gold text-white font-black text-3xl py-4 rounded-2xl shadow-lg disabled:opacity-50"
          >
            {rolling ? '擲骰中...' : '🎲 擲骰!'}
          </motion.button>
        )}

        {!isFinished && hasRolled && (
          <p className="text-center text-white/70">等待其他玩家...</p>
        )}

        {isFinished && (
          <button
            onClick={leaveRoom}
            className="w-full bg-white text-festive-red font-black text-xl py-3 rounded-xl"
          >
            回主頁
          </button>
        )}
      </div>
    </div>
  )
}
```

**Step 2: Commit**

```bash
git add src/screens/GameScreen.tsx
git commit -m "feat: game screen with dice rolling and real-time player display"
```

---

### Task 12: Leaderboard Screen

**Files:**
- Create: `src/screens/LeaderboardScreen.tsx`
- Create: `src/hooks/useLeaderboard.ts`

**Step 1: Create leaderboard hook**

```ts
// src/hooks/useLeaderboard.ts
import { useEffect, useState } from 'react'
import { topLeaderboardQuery } from '../lib/rtdb'
import { onValue } from 'firebase/database'
import { getCurrentSeason } from '../game/room'
import type { LeaderboardEntry } from '../types'

export function useLeaderboard() {
  const [alltime, setAlltime] = useState<[string, LeaderboardEntry][]>([])
  const [seasonal, setSeasonal] = useState<[string, LeaderboardEntry][]>([])
  const [loading, setLoading] = useState(true)
  const season = getCurrentSeason()

  useEffect(() => {
    let loaded = 0
    const done = () => { if (++loaded === 2) setLoading(false) }

    const u1 = onValue(topLeaderboardQuery('alltime'), snap => {
      const data = snap.val() ?? {}
      const sorted = Object.entries(data as Record<string, LeaderboardEntry>)
        .sort((a, b) => b[1].wins - a[1].wins)
      setAlltime(sorted)
      done()
    })

    const u2 = onValue(topLeaderboardQuery(season), snap => {
      const data = snap.val() ?? {}
      const sorted = Object.entries(data as Record<string, LeaderboardEntry>)
        .sort((a, b) => b[1].wins - a[1].wins)
      setSeasonal(sorted)
      done()
    })

    return () => { u1(); u2() }
  }, [season])

  return { alltime, seasonal, loading, season }
}
```

**Step 2: Create LeaderboardScreen**

```tsx
// src/screens/LeaderboardScreen.tsx
import { useState } from 'react'
import { useLeaderboard } from '../hooks/useLeaderboard'
import type { LeaderboardEntry } from '../types'

interface Props { onBack?: () => void }

export function LeaderboardScreen({ onBack }: Props) {
  const { alltime, seasonal, loading, season } = useLeaderboard()
  const [tab, setTab] = useState<'alltime' | 'season'>('alltime')

  const entries: [string, LeaderboardEntry][] = tab === 'alltime' ? alltime : seasonal

  return (
    <div className="min-h-screen bg-festive-red flex flex-col items-center p-4 pt-8">
      <div className="w-full max-w-sm">
        <div className="flex items-center mb-4">
          {onBack && (
            <button onClick={onBack} className="text-white/70 hover:text-white mr-3">←</button>
          )}
          <h2 className="text-3xl font-black text-festive-gold">🏆 排行榜</h2>
        </div>

        {/* Tabs */}
        <div className="flex bg-white/10 rounded-xl p-1 mb-4">
          <button
            onClick={() => setTab('alltime')}
            className={`flex-1 py-2 rounded-lg font-bold transition-colors ${tab === 'alltime' ? 'bg-festive-gold text-white' : 'text-white/70'}`}
          >
            總排行
          </button>
          <button
            onClick={() => setTab('season')}
            className={`flex-1 py-2 rounded-lg font-bold transition-colors ${tab === 'season' ? 'bg-festive-gold text-white' : 'text-white/70'}`}
          >
            {season}
          </button>
        </div>

        {loading ? (
          <p className="text-center text-white/70 py-8">載入中...</p>
        ) : entries.length === 0 ? (
          <p className="text-center text-white/50 py-8">還沒有記錄 — 快去玩！</p>
        ) : (
          <div className="space-y-2">
            {entries.map(([uid, entry], i) => (
              <div key={uid} className="flex items-center bg-white/10 rounded-xl px-4 py-3">
                <span className="text-festive-gold font-black w-8 text-lg">
                  {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`}
                </span>
                <span className="text-white font-bold flex-1">{entry.nickname}</span>
                <div className="text-right">
                  <div className="text-festive-gold font-black">{entry.wins} 勝</div>
                  <div className="text-white/50 text-sm">{(entry.winRate * 100).toFixed(0)}%</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
```

**Step 3: Commit**

```bash
git add src/hooks/useLeaderboard.ts src/screens/LeaderboardScreen.tsx
git commit -m "feat: leaderboard screen with all-time and seasonal tabs"
```

---

### Task 13: GitHub Pages Deployment

**Files:**
- Modify: `package.json` (update homepage field)
- Create: `.github/workflows/deploy.yml`

**Step 1: Set homepage in package.json**

Update the `homepage` field:
```json
"homepage": "https://<your-github-username>.github.io/shibala"
```

Also update `vite.config.ts` base to match:
```ts
base: '/shibala/',
```

**Step 2: Create GitHub Actions deploy workflow**

Create `.github/workflows/deploy.yml`:
```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm ci
      - run: npm run build
        env:
          VITE_FIREBASE_API_KEY: ${{ secrets.VITE_FIREBASE_API_KEY }}
          VITE_FIREBASE_AUTH_DOMAIN: ${{ secrets.VITE_FIREBASE_AUTH_DOMAIN }}
          VITE_FIREBASE_DATABASE_URL: ${{ secrets.VITE_FIREBASE_DATABASE_URL }}
          VITE_FIREBASE_PROJECT_ID: ${{ secrets.VITE_FIREBASE_PROJECT_ID }}
          VITE_FIREBASE_STORAGE_BUCKET: ${{ secrets.VITE_FIREBASE_STORAGE_BUCKET }}
          VITE_FIREBASE_MESSAGING_SENDER_ID: ${{ secrets.VITE_FIREBASE_MESSAGING_SENDER_ID }}
          VITE_FIREBASE_APP_ID: ${{ secrets.VITE_FIREBASE_APP_ID }}
      - uses: peaceiris/actions-gh-pages@v4
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./dist
```

**Step 3: Add Firebase secrets to GitHub repo**

In your GitHub repo → Settings → Secrets and variables → Actions, add each `VITE_FIREBASE_*` variable from your `.env.local`.

**Step 4: Create GitHub repo and push**

```bash
gh repo create shibala --public --source=. --push
```

**Step 5: Verify deploy**

```bash
gh run list --repo <username>/shibala
```

Wait for green check, then visit `https://<username>.github.io/shibala`

**Step 6: Commit**

```bash
git add .github/ package.json vite.config.ts
git commit -m "feat: add GitHub Actions deploy workflow for GitHub Pages"
```

---

### Task 14: Final Polish & RTDB Security Rules

**Step 1: Set Firebase RTDB security rules**

In Firebase Console → Realtime Database → Rules, replace with:
```json
{
  "rules": {
    "rooms": {
      "$roomId": {
        ".read": true,
        ".write": "auth != null"
      }
    },
    "players": {
      "$uid": {
        ".read": true,
        ".write": "auth != null && auth.uid === $uid"
      }
    },
    "leaderboard": {
      ".read": true,
      "$key": {
        "$uid": {
          ".write": "auth != null && auth.uid === $uid"
        }
      }
    }
  }
}
```

**Step 2: Add 404 redirect for GitHub Pages SPA routing**

Create `public/404.html` that redirects to `index.html` with the path preserved (standard GitHub Pages SPA trick):
```html
<!DOCTYPE html>
<html>
<head>
  <script>
    sessionStorage.redirect = location.href;
  </script>
  <meta http-equiv="refresh" content="0;URL=/shibala/">
</head>
</html>
```

And in `index.html` `<head>`:
```html
<script>
  (function(){
    var redirect = sessionStorage.redirect;
    delete sessionStorage.redirect;
    if (redirect && redirect !== location.href) {
      history.replaceState(null, null, redirect);
    }
  })();
</script>
```

**Step 3: Run full test suite**

```bash
npx vitest run
```
Expected: All tests pass

**Step 4: Final build check**

```bash
npm run build
```
Expected: No TypeScript errors, dist/ created

**Step 5: Final commit**

```bash
git add -A
git commit -m "feat: RTDB security rules, SPA routing fix, production ready"
```

---

## Done! 🎲

The game is live at `https://<username>.github.io/shibala`.

**What was built:**
- Real-time 2-6 player 十八啦 rooms via Firebase RTDB
- Anonymous auth with nicknames
- Festive 台味 UI with Framer Motion dice animations
- Global + seasonal leaderboards
- GitHub Actions CI/CD to GitHub Pages
