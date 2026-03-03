// src/hooks/useAuth.ts
import { useEffect, useState } from 'react'
import { signInAnonymously, onAuthStateChanged } from 'firebase/auth'
import { auth } from '../lib/firebase'
import { playerRef, get, set, update } from '../lib/rtdb'
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
        try {
          const snap = await get(playerRef(user.uid))
          const existing = snap.val() as PlayerStats | null
          setState({
            uid: user.uid,
            nickname: existing?.nickname ?? null,
            loading: false,
          })
        } catch {
          setState({ uid: user.uid, nickname: null, loading: false })
        }
      } else {
        try {
          await signInAnonymously(auth)
        } catch {
          setState({ uid: null, nickname: null, loading: false })
        }
      }
    })
    return unsubscribe
  }, [])

  async function setNickname(nickname: string) {
    const currentUid = state.uid
    if (!currentUid) return
    const snap = await get(playerRef(currentUid))
    if (snap.exists()) {
      await update(playerRef(currentUid), { nickname })
    } else {
      await set(playerRef(currentUid), {
        nickname,
        gamesPlayed: 0,
        wins: 0,
        losses: 0,
        highScore: 0,
        seasonKey: '',
        seasonWins: 0,
      } satisfies PlayerStats)
    }
    setState(prev => ({ ...prev, nickname }))
  }

  return { ...state, setNickname }
}
