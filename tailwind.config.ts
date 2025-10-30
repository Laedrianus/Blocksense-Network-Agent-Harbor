import type { Config } from 'tailwindcss'

export default {
  content: [
    './index.html',
    './App.tsx',
    './components/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {},
  },
  plugins: [],
} satisfies Config


