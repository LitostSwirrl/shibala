// src/screens/LeaderboardScreen.tsx
import { useState } from 'react'
import { useLeaderboard } from '../hooks/useLeaderboard'
import type { LeaderboardEntry } from '../types'

interface Props {
  onBack: () => void
}

export function LeaderboardScreen({ onBack }: Props) {
  const { alltime, seasonal, loading, season } = useLeaderboard()
  const [tab, setTab] = useState<'alltime' | 'season'>('alltime')

  const entries: [string, LeaderboardEntry][] = tab === 'alltime' ? alltime : seasonal

  const rankEmoji = (i: number) => {
    if (i === 0) return '🥇'
    if (i === 1) return '🥈'
    if (i === 2) return '🥉'
    return `${i + 1}.`
  }

  return (
    <div className="min-h-screen bg-festive-red flex flex-col items-center p-4 pt-8">
      <div className="w-full max-w-sm">
        {/* Header */}
        <div className="flex items-center mb-4">
          <button
            onClick={onBack}
            className="text-white/70 hover:text-white mr-3 text-xl transition-colors"
          >
            ←
          </button>
          <h2 className="text-3xl font-black text-festive-gold font-game">🏆 排行榜</h2>
        </div>

        {/* Tab toggle */}
        <div className="flex bg-white/10 rounded-xl p-1 mb-4">
          <button
            onClick={() => setTab('alltime')}
            className={`flex-1 py-2 rounded-lg font-bold transition-colors ${
              tab === 'alltime' ? 'bg-festive-gold text-white' : 'text-white/70 hover:text-white'
            }`}
          >
            總排行
          </button>
          <button
            onClick={() => setTab('season')}
            className={`flex-1 py-2 rounded-lg font-bold transition-colors ${
              tab === 'season' ? 'bg-festive-gold text-white' : 'text-white/70 hover:text-white'
            }`}
          >
            {season}
          </button>
        </div>

        {/* Content */}
        {loading ? (
          <p className="text-center text-white/70 py-8 animate-pulse">載入排行榜...</p>
        ) : entries.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-white/50 text-lg">還沒有記錄</p>
            <p className="text-white/30 text-sm mt-1">快去玩一局！</p>
          </div>
        ) : (
          <div className="space-y-2">
            {entries.map(([uid, entry], i) => (
              <div key={uid} className="flex items-center bg-white/10 rounded-xl px-4 py-3">
                <span className="text-festive-gold font-black w-8 text-lg">
                  {rankEmoji(i)}
                </span>
                <span className="text-white font-bold flex-1 truncate">{entry.nickname}</span>
                <div className="text-right ml-2">
                  <div className="text-festive-gold font-black">{entry.wins} 勝</div>
                  <div className="text-white/50 text-xs">{(entry.winRate * 100).toFixed(0)}%</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
