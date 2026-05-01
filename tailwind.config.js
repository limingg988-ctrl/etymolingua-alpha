/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./App.tsx",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eef3ff',
          100: '#dae4ff',
          200: '#b7c7ff',
          300: '#8b9efc',
          400: '#6e7af8',
          500: '#5662ff',
          600: '#4045f5',
          700: '#3436d8',
          800: '#2f32ae',
          900: '#2a2f89'
        },
        secondary: {
          50: '#ecfdf5',
          100: '#d1fae5',
          300: '#6ee7b7',
          500: '#10b981',
          700: '#047857'
        },
        surface: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          500: '#64748b',
          700: '#334155',
          900: '#0f172a'
        }
      },
      fontFamily: {
        sans: ['Manrope', 'Noto Sans JP', 'sans-serif'],
        display: ['Newsreader', 'Noto Serif JP', 'serif']
      }
    },
  },
  plugins: [],
}
