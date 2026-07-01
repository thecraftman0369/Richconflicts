import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ['var(--font-bebas)', 'Impact', 'sans-serif'],
        mono: ['var(--font-space-mono)', 'Courier New', 'monospace'],
      },
      fontSize: {
        'display-xl': ['clamp(4rem, 14vw, 14rem)', { lineHeight: '0.88' }],
        'display-lg': ['clamp(2.5rem, 8vw, 8rem)', { lineHeight: '0.92' }],
        'display-md': ['clamp(1.8rem, 4.5vw, 4.5rem)', { lineHeight: '0.96' }],
      },
      colors: {
        'rc-black': '#000000',
        'rc-white': '#ffffff',
        'rc-border': '#1a1a1a',
        'rc-muted': '#555555',
        'rc-subtle': '#0a0a0a',
        'rc-hover': '#111111',
      },
      screens: {
        '2xl': '1600px',
      },
    },
  },
  plugins: [],
}

export default config
