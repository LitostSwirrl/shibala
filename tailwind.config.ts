import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        festive: {
          red: '#DC2626',
          gold: '#D97706',
          darkred: '#991B1B',
          cream: '#FEF3C7',
        }
      },
      fontFamily: {
        game: ['"Noto Sans TC"', 'sans-serif'],
      }
    },
  },
  plugins: [],
} satisfies Config
