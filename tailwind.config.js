/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Orbitron', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      colors: {
        racing: {
          bg: '#090b10',
          card: '#121621',
          border: '#232a3d',
          neon: '#ff3366',
          cyan: '#00f0ff',
          gold: '#ffb800',
          green: '#00e676',
        }
      }
    },
  },
  plugins: [],
}
