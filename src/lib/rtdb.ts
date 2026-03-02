// src/lib/rtdb.ts
import { ref, set, get, update, onValue, push, remove, query, orderByChild, limitToLast } from 'firebase/database'
import { db } from './firebase'

export const roomRef = (roomId: string) => ref(db, `rooms/${roomId}`)
export const playerRef = (uid: string) => ref(db, `players/${uid}`)
export const leaderboardRef = (key: 'alltime' | string) => ref(db, `leaderboard/${key}`)
export const topLeaderboardQuery = (key: string) =>
  query(leaderboardRef(key), orderByChild('wins'), limitToLast(20))

export { ref, set, get, update, onValue, push, remove }
