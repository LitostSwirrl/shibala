// src/screens/LobbyScreen.tsx
import { useGame } from '../context/GameContext'

export function LobbyScreen() {
  const { room, roomId, uid, setReady, startGame, leaveRoom } = useGame()
  if (!room || !roomId) return null

  const players = Object.entries(room.players)
  const allReady = players.every(([, p]) => p.ready)
  const isHost = room.hostUid === uid
  const myPlayer = uid ? room.players[uid] : null
  const canStart = isHost && allReady && players.length >= 2

  return (
    <div className="min-h-screen bg-festive-red flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-4">
        {/* Header */}
        <div className="text-center">
          <h2 className="text-3xl font-black text-festive-gold font-game">等待室</h2>
          <p className="text-white mt-1">分享房間代碼</p>
          <div className="bg-festive-gold text-white font-black text-4xl tracking-widest py-2 px-6 rounded-2xl inline-block mt-1">
            {roomId}
          </div>
        </div>

        {/* Player list */}
        <div className="bg-white/10 rounded-2xl p-4 space-y-2">
          <p className="text-festive-gold font-bold">{players.length}/6 玩家</p>
          {players.map(([pid, player]) => (
            <div key={pid} className="flex items-center justify-between bg-white/10 rounded-xl px-4 py-2">
              <span className="text-white font-bold">
                {player.nickname}{pid === room.hostUid ? ' 👑' : ''}
              </span>
              <span className="text-sm">
                {player.ready ? '✅ 準備好' : '⏳ 等待中'}
              </span>
            </div>
          ))}
        </div>

        {/* Ready button (non-host or not yet ready) */}
        {!myPlayer?.ready && (
          <button
            onClick={setReady}
            className="w-full bg-white text-festive-red font-black text-xl py-3 rounded-xl hover:bg-festive-cream transition-colors"
          >
            我準備好了!
          </button>
        )}

        {/* Start button (host only, all ready, 2+ players) */}
        {canStart && (
          <button
            onClick={startGame}
            className="w-full bg-festive-gold text-white font-black text-xl py-3 rounded-xl animate-bounce"
          >
            開始遊戲! 🎲
          </button>
        )}

        {/* Waiting message for non-hosts after ready */}
        {myPlayer?.ready && !isHost && (
          <p className="text-center text-white/70">等待房主開始遊戲...</p>
        )}

        {/* Not enough players message */}
        {isHost && allReady && players.length < 2 && (
          <p className="text-center text-white/70">等待更多玩家加入...</p>
        )}

        <button
          onClick={leaveRoom}
          className="w-full text-white/50 hover:text-white text-center py-2 transition-colors"
        >
          離開房間
        </button>
      </div>
    </div>
  )
}
