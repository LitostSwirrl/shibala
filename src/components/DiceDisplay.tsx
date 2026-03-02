// src/components/DiceDisplay.tsx
import { motion } from 'framer-motion'

const DICE_FACES: Record<number, string> = {
  1: '⚀', 2: '⚁', 3: '⚂', 4: '⚃', 5: '⚄', 6: '⚅'
}

interface DiceDisplayProps {
  dice: number[]
  rolling?: boolean
}

export function DiceDisplay({ dice, rolling = false }: DiceDisplayProps) {
  return (
    <div className="flex gap-2 justify-center">
      {dice.length > 0
        ? dice.map((d, i) => (
            <motion.div
              key={`${i}-${rolling}`}
              className="w-14 h-14 bg-white rounded-xl flex items-center justify-center text-4xl shadow-lg select-none"
              animate={rolling
                ? { rotate: [0, 180, 360, 540, 720], scale: [1, 1.2, 0.9, 1.1, 1] }
                : { rotate: 0, scale: 1 }
              }
              transition={{ duration: 0.8, ease: 'easeOut' }}
            >
              {DICE_FACES[d] ?? '🎲'}
            </motion.div>
          ))
        : Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center text-3xl select-none"
            >
              🎲
            </div>
          ))
      }
    </div>
  )
}
