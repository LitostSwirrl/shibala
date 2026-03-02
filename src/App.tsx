// src/App.tsx
import { useGame } from './context/GameContext'

export default function App() {
  const { loading } = useGame()

  if (loading) return (
    <div className="min-h-screen bg-festive-red flex items-center justify-center">
      <p className="text-festive-gold text-2xl animate-pulse font-game">載入中...</p>
    </div>
  )

  return (
    <div className="min-h-screen bg-festive-red flex items-center justify-center">
      <h1 className="text-festive-gold text-4xl font-black font-game">十八啦!</h1>
    </div>
  )
}
