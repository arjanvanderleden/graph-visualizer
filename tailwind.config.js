/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        dark: {
          bg: '#0f0f0f',
          surface: '#1a1a1a',
          border: '#2a2a2a',
          text: {
            primary: '#ffffff',
            secondary: '#a3a3a3',
            muted: '#737373'
          }
        },
        accent: {
          primary: '#3b82f6',
          secondary: '#06b6d4',
          success: '#10b981',
          warning: '#f59e0b',
          error: '#ef4444'
        }
      }
    },
  },
  plugins: [],
}