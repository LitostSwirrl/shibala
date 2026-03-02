// src/hooks/useRoom.ts
import { useEffect, useState } from 'react'
import { roomRef, playerRef, onValue, set, get, update, remove } from '../lib/rtdb'
import { ref, update as rtdbUpdate } from 'firebase/database'
import { db } from '../lib/firebase'
import { generateRoomCode } from '../game/dice'
import { getRoundWinner, isGameOver, getCurrentSeason } from '../game/room'
import { calculateScore } from '../game/scoring'
import type { Room, PlayerStats, RoundResult } from '../types'

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

  async function createRoom(nickname: string, maxRounds: 1 | 3 | 5): Promise<string | undefined> {
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

  async function joinRoom(id: string, nickname: string): Promise<void> {
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

  async function setReady(): Promise<void> {
    if (!uid || !roomId) return
    await update(roomRef(roomId), { [`players/${uid}/ready`]: true })
  }

  async function startGame(): Promise<void> {
    if (!roomId) return
    await update(roomRef(roomId), { status: 'playing', round: 1 })
  }

  async function roll(dice: number[], nickname: string): Promise<void> {
    if (!uid || !roomId || !room) return
    const result = calculateScore(dice)
    const roundScore = result.loseByOnes ? -1 : result.score

    // Update RTDB: this player's dice, rolled=true, and their round score
    await update(roomRef(roomId), {
      [`players/${uid}/dice`]: dice,
      [`players/${uid}/rolled`]: true,
      [`roundResults/${room.round}/scores/${uid}`]: roundScore,
    })

    // Check if all players have rolled (use current room snapshot + this update)
    const updatedRolled = { ...Object.fromEntries(
      Object.entries(room.players).map(([pid, p]) => [pid, pid === uid ? true : p.rolled])
    )}
    const allRolled = Object.values(updatedRolled).every(Boolean)

    if (allRolled) {
      // Get current round scores including this player's new score
      const existingRound: RoundResult = room.roundResults[room.round] ?? { scores: {}, winner: '' }
      const roundScores: Record<string, number> = {
        ...existingRound.scores,
        [uid]: roundScore,
      }
      const winner = getRoundWinner(roundScores)

      const updates: Record<string, unknown> = {
        [`roundResults/${room.round}/winner`]: winner,
      }

      if (winner) {
        updates[`players/${winner}/score`] = (room.players[winner]?.score ?? 0) + 1
      }

      if (isGameOver({ ...room, round: room.round })) {
        updates['status'] = 'finished'
        // Finalize stats async — don't block the room update
        void finalizeGame(room, roundScores, uid, nickname)
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

  async function leaveRoom(): Promise<void> {
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

async function finalizeGame(
  room: Room,
  lastRoundScores: Record<string, number>,
  myUid: string,
  myNickname: string
): Promise<void> {
  // Determine game winner by total round wins (score field in players)
  const scores = Object.entries(room.players).map(([uid, p]) => ({ uid, score: p.score }))
  const maxScore = Math.max(...scores.map(s => s.score))
  const gameWinners = scores.filter(s => s.score === maxScore).map(s => s.uid)
  const iWon = gameWinners.includes(myUid)

  const season = getCurrentSeason()
  const playerSnap = await get(playerRef(myUid))
  const existingStats = playerSnap.val() as PlayerStats | null
  const stats: PlayerStats = existingStats ?? {
    nickname: myNickname,
    gamesPlayed: 0,
    wins: 0,
    losses: 0,
    highScore: 0,
    seasonKey: season,
  }

  // Find highest single-round score this player got (across all rounds)
  const myRoundScores = Object.values(room.roundResults)
    .map(r => r.scores[myUid] ?? 0)
    .filter(s => s > 0)
  myRoundScores.push(Math.max(lastRoundScores[myUid] ?? 0, 0))
  const myHighScore = Math.max(...myRoundScores, 0)

  const updatedStats: PlayerStats = {
    ...stats,
    gamesPlayed: stats.gamesPlayed + 1,
    wins: iWon ? stats.wins + 1 : stats.wins,
    losses: iWon ? stats.losses : stats.losses + 1,
    highScore: Math.max(stats.highScore, myHighScore),
    seasonKey: season,
  }

  const winRate = updatedStats.gamesPlayed > 0
    ? updatedStats.wins / updatedStats.gamesPlayed
    : 0

  await rtdbUpdate(ref(db), {
    [`players/${myUid}`]: updatedStats,
    [`leaderboard/alltime/${myUid}`]: { nickname: myNickname, wins: updatedStats.wins, winRate },
    [`leaderboard/${season}/${myUid}`]: { nickname: myNickname, wins: updatedStats.wins, winRate },
  })
}

