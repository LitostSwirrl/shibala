// src/hooks/useLeaderboard.ts
import { useEffect, useState } from 'react'
import { topLeaderboardQuery, onValue } from '../lib/rtdb'
import { getCurrentSeason } from '../game/room'
import type { LeaderboardEntry } from '../types'

export function useLeaderboard() {
  const [alltime, setAlltime] = useState<[string, LeaderboardEntry][]>([])
  const [seasonal, setSeasonal] = useState<[string, LeaderboardEntry][]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const season = getCurrentSeason()

  useEffect(() => {
    // Track whether each listener has fired its first value
    let alltimeReady = false
    let seasonalReady = false

    const maybeSetLoaded = () => {
      if (alltimeReady && seasonalReady) setLoading(false)
    }

    const unsub1 = onValue(
      topLeaderboardQuery('alltime'),
      snap => {
        const data = snap.val() ?? {}
        const sorted = Object.entries(data as Record<string, LeaderboardEntry>)
          .sort((a, b) => b[1].wins - a[1].wins)
        setAlltime(sorted)
        alltimeReady = true
        maybeSetLoaded()
      },
      (err) => {
        setError(err.message)
        alltimeReady = true
        maybeSetLoaded()
      }
    )

    const unsub2 = onValue(
      topLeaderboardQuery(season),
      snap => {
        const data = snap.val() ?? {}
        const sorted = Object.entries(data as Record<string, LeaderboardEntry>)
          .sort((a, b) => b[1].wins - a[1].wins)
        setSeasonal(sorted)
        seasonalReady = true
        maybeSetLoaded()
      },
      (err) => {
        setError(err.message)
        seasonalReady = true
        maybeSetLoaded()
      }
    )

    return () => { unsub1(); unsub2() }
  }, [season])

  return { alltime, seasonal, loading, error, season }
}
