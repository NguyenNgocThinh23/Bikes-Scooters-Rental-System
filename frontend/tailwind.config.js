/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#142B45', // Dark Navy
          dark: '#0C1C2E',
          light: '#1F3C5E'
        },
        secondary: {
          DEFAULT: '#20B875', // Brand Green
          hover: '#199E63',
          light: '#34D399'
        },
        accent: {
          DEFAULT: '#E7F8EF', // Soft Green
          light: '#F2FCF6'
        },
        bgLight: '#F7F9FC', // Light Gray Background
        textDark: '#263238', // Dark Gray
        textMuted: '#607D8B'
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        card: '0 4px 20px -2px rgba(20, 43, 69, 0.06), 0 2px 6px -1px rgba(20, 43, 69, 0.04)',
        hover: '0 12px 30px -4px rgba(20, 43, 69, 0.12), 0 4px 10px -2px rgba(20, 43, 69, 0.06)'
      }
    },
  },
  plugins: [],
}
