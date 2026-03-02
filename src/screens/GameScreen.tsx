// src/screens/GameScreen.tsx
import { useState } from 'react'
import { motion } from 'framer-motion'
import { useGame } from '../context/GameContext'
import { DiceDisplay } from '../components/DiceDisplay'
import { rollDice } from '../game/dice'
import { calculateScore } from '../game/scoring'

export function GameScreen() {
  const { room, uid, nickname, roll, leaveRoom } = useGame()
  const [rolling, setRolling] = useState(false)
  const [rollError, setRollError] = useState<string | null>(null)

  if (!room || !uid) return null

  const players = Object.entries(room.players).sort(([a], [b]) => a.localeCompare(b))
  const myPlayer = room.players[uid]
  const hasRolled = myPlayer?.rolled ?? false
  const isFinished = room.status === 'finished'

  async function handleRoll() {
    if (hasRolled || rolling || !nickname) return
    setRolling(true)
    setRollError(null)
    try {
      const dice = rollDice()
      await new Promise<void>(resolve => setTimeout(resolve, 900))
      await roll(dice, nickname)
    } catch (err) {
      console.error('[handleRoll]', err)
      setRollError('擲骰失敗，請再試一次')
    } finally {
      setRolling(false)
    }
  }

  // Determine game winner (player with most round wins)
  const gameWinner = isFinished
    ? players.reduce((best, curr) =>
        curr[1].score > best[1].score ? curr : best
      )
    : null

  return (
    <div className="min-h-screen bg-festive-red flex flex-col items-center p-4 pt-8 pb-8">
      <div className="w-full max-w-sm space-y-4">

        {/* Header */}
        <div className="text-center">
          <h2 className="text-festive-gold font-black text-2xl font-game">
            {isFinished ? '遊戲結束!' : `第 ${room.round} / ${room.maxRounds} 局`}
          </h2>
        </div>

        {/* Game over winner banner */}
        {isFinished && gameWinner && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 300 }}
            className="bg-festive-gold text-white text-center rounded-2xl p-4 font-black text-2xl font-game"
          >
            🏆 {gameWinner[1].nickname} 獲勝!
          </motion.div>
        )}

        {/* Player panels */}
        <div className="space-y-3">
          {players.map(([pid, player]) => {
            const isMe = pid === uid
            const result = (player.dice ?? []).length > 0 ? calculateScore(player.dice ?? []) : null

            return (
              <div
                key={pid}
                className={`rounded-2xl p-4 space-y-3 ${
                  isMe
                    ? 'bg-white/20 border-2 border-festive-gold'
                    : 'bg-white/10'
                }`}
              >
                {/* Player header */}
                <div className="flex justify-between items-center">
                  <span className="text-white font-bold">
                    {player.nickname}
                    {isMe ? ' (我)' : ''}
                    {pid === room.hostUid ? ' 👑' : ''}
                  </span>
                  <span className="text-festive-gold font-black">
                    {player.score} 勝
                  </span>
                </div>

                {/* Dice */}
                <DiceDisplay
                  dice={player.dice}
                  rolling={isMe && rolling}
                />

                {/* Score result */}
                {result && (
                  <div className="text-center font-bold text-lg">
                    {result.loseByOnes && (
                      <span className="text-red-300">一一！自動輸！💀</span>
                    )}
                    {result.pig && (
                      <span className="text-orange-300">豬頭！無對子！😤</span>
                    )}
                    {!result.pig && !result.loseByOnes && (
                      <span className={result.score === 12 ? 'text-festive-gold text-xl' : 'text-white'}>
                        {result.score === 12 ? '🎉 十八啦！！' : `得 ${result.score} 分`}
                      </span>
                    )}
                  </div>
                )}

                {/* Waiting indicator for other players */}
                {!isMe && !player.rolled && (
                  <p className="text-center text-white/50 text-sm">擲骰中...</p>
                )}
              </div>
            )
          })}
        </div>

        {/* Roll button */}
        {rollError && (
          <p className="text-center text-red-300 text-sm">{rollError}</p>
        )}
        {!isFinished && !hasRolled && (
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleRoll}
            disabled={rolling}
            className="w-full bg-festive-gold text-white font-black text-3xl py-4 rounded-2xl shadow-lg disabled:opacity-50"
          >
            {rolling ? '擲骰中...' : '🎲 擲骰!'}
          </motion.button>
        )}

        {!isFinished && hasRolled && (
          <p className="text-center text-white/70 py-2">等待其他玩家擲骰...</p>
        )}

        {/* Game over: back to home */}
        {isFinished && (
          <button
            onClick={leaveRoom}
            className="w-full bg-white text-festive-red font-black text-xl py-3 rounded-xl hover:bg-festive-cream transition-colors"
          >
            回主頁
          </button>
        )}
      </div>
    </div>
  )
}
