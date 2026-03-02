// src/hooks/useLeaderboard.ts
import { useEffect, useState } from 'react'
import { topLeaderboardQuery, onValue } from '../lib/rtdb'
import { getCurrentSeason } from '../game/room'
import type { LeaderboardEntry } from '../types'

export function useLeaderboard() {
  const [alltime, setAlltime] = useState<[string, LeaderboardEntry][]>([])
  const [seasonal, setSeasonal] = useState<[string, LeaderboardEntry][]>([])
  const [loading, setLoading] = useState(true)
  const season = getCurrentSeason()

  useEffect(() => {
    let loadedCount = 0
    const onBothLoaded = () => {
      if (++loadedCount === 2) setLoading(false)
    }

    const unsub1 = onValue(topLeaderboardQuery('alltime'), snap => {
      const data = snap.val() ?? {}
      const sorted = Object.entries(data as Record<string, LeaderboardEntry>)
        .sort((a, b) => b[1].wins - a[1].wins)
      setAlltime(sorted)
      onBothLoaded()
    })

    const unsub2 = onValue(topLeaderboardQuery(season), snap => {
      const data = snap.val() ?? {}
      const sorted = Object.entries(data as Record<string, LeaderboardEntry>)
        .sort((a, b) => b[1].wins - a[1].wins)
      setSeasonal(sorted)
      onBothLoaded()
    })

    return () => { unsub1(); unsub2() }
  }, [season])

  return { alltime, seasonal, loading, season }
}
