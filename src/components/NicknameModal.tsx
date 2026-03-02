// src/components/NicknameModal.tsx
import { useState } from 'react'
import { useGame } from '../context/GameContext'

export function NicknameModal() {
  const { setNickname } = useGame()
  const [value, setValue] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = value.trim()
    if (!trimmed) return
    setLoading(true)
    await setNickname(trimmed)
  }

  return (
    <div className="min-h-screen bg-festive-red flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-8 w-full max-w-sm shadow-2xl border-4 border-festive-gold">
        <h1 className="text-3xl font-black text-center text-festive-red mb-2 font-game">🎲 十八啦!</h1>
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
