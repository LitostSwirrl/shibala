// src/context/GameContext.tsx
import { createContext, useContext, ReactNode } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useRoom } from '../hooks/useRoom'

type GameContextType = ReturnType<typeof useAuth> & ReturnType<typeof useRoom>

const GameContext = createContext<GameContextType | null>(null)

export function GameProvider({ children }: { children: ReactNode }) {
  const auth = useAuth()
  const room = useRoom(auth.uid)
  return (
    <GameContext.Provider value={{ ...auth, ...room }}>
      {children}
    </GameContext.Provider>
  )
}

export function useGame() {
  const ctx = useContext(GameContext)
  if (!ctx) throw new Error('useGame must be used inside GameProvider')
  return ctx
}
