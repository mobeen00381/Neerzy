import type { Config } from 'tailwindcss'
const config: Config = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: 'var(--ink)',
          2: 'var(--ink2)',
          3: 'var(--ink3)',
          4: 'var(--ink4)',
        },
        paper: {
          DEFAULT: 'var(--paper)',
          2: 'var(--paper2)',
          3: 'var(--paper3)',
          4: 'var(--paper4)',
        },
        teal: {
          DEFAULT: 'var(--teal)',
          2: 'var(--teal2)',
          3: 'var(--teal3)',
          soft: 'var(--teal-soft)',
        },
        mint: 'var(--mint)',
        sun: {
          DEFAULT: 'var(--sun)',
          2: 'var(--sun2)',
          soft: 'var(--sun-soft)',
        },
        navy: 'var(--ink)',
        primary: {
          DEFAULT: 'var(--primary)',
          dark: 'var(--primary-active)',
          light: 'var(--primary-light)',
        },
        secondary: {
          DEFAULT: 'var(--secondary)',
        },
      },
      fontFamily: {
        sans: ['var(--font-jakarta)', 'Plus Jakarta Sans', 'system-ui', 'sans-serif'],
        display: ['var(--font-poppins)', 'Poppins', 'sans-serif'],
      },
      borderColor: {
        DEFAULT: 'var(--border)',
      },
    },
  },
  plugins: [],
}
export default config
