// src/App.tsx
import { useGame } from './context/GameContext'
import { NicknameModal } from './components/NicknameModal'
import { HomeScreen } from './screens/HomeScreen'
import { LobbyScreen } from './screens/LobbyScreen'
import { GameScreen } from './screens/GameScreen'

export default function App() {
  const { loading, nickname, uid, room, roomId } = useGame()

  if (loading) return (
    <div className="min-h-screen bg-festive-red flex items-center justify-center">
      <p className="text-festive-gold text-2xl animate-pulse font-game">載入中...</p>
    </div>
  )

  if (!nickname && uid) return <NicknameModal />
  if (room?.status === 'waiting' && roomId) return <LobbyScreen />
  if ((room?.status === 'playing' || room?.status === 'finished') && roomId) return <GameScreen />

  return <HomeScreen />
}
