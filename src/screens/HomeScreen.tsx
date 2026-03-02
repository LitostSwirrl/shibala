// src/screens/HomeScreen.tsx
import { useState } from 'react'
import { useGame } from '../context/GameContext'

export function HomeScreen() {
  const { nickname, createRoom, joinRoom, error } = useGame()
  const [joinCode, setJoinCode] = useState('')
  const [maxRounds, setMaxRounds] = useState<1 | 3 | 5>(3)
  const [creating, setCreating] = useState(false)
  const [joining, setJoining] = useState(false)

  async function handleCreate() {
    if (!nickname) return
    setCreating(true)
    await createRoom(nickname, maxRounds)
    setCreating(false)
  }

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault()
    if (!nickname || !joinCode.trim()) return
    setJoining(true)
    await joinRoom(joinCode.trim().toUpperCase(), nickname)
    setJoining(false)
  }

  return (
    <div className="min-h-screen bg-festive-red flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-4">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-5xl font-black text-festive-gold drop-shadow-lg font-game">🎲 十八啦!</h1>
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
            disabled={creating}
            className="w-full bg-festive-gold text-white font-black text-xl py-3 rounded-xl hover:opacity-90 disabled:opacity-50 transition-opacity"
          >
            {creating ? '建立中...' : '開房間'}
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

        {/* Leaderboard placeholder */}
        <button
          className="w-full text-white/70 hover:text-white py-2 text-center transition-colors"
        >
          🏆 排行榜
        </button>
      </div>
    </div>
  )
}
