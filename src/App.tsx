// src/App.tsx
import { useGame } from './context/GameContext'
import { NicknameModal } from './components/NicknameModal'
import { HomeScreen } from './screens/HomeScreen'

export default function App() {
  const { loading, nickname, uid } = useGame()

  if (loading) return (
    <div className="min-h-screen bg-festive-red flex items-center justify-center">
      <p className="text-festive-gold text-2xl animate-pulse font-game">載入中...</p>
    </div>
  )

  if (!nickname && uid) return <NicknameModal />

  return <HomeScreen />
}
