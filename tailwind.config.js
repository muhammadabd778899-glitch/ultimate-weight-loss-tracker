/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        bg: '#F6FBF6',
        surface: '#FFFFFF',
        green: {
          primary: '#2E9D59',
          deep: '#176B3A',
          soft: '#E5F5E8',
          mint: '#A8DDB5',
          sage: '#D9EBDD',
        },
        dark: '#203329',
        secondary: '#718078',
        border: '#E5EDE6',
        success: '#319B61',
        warning: '#E5A94F',
        attention: '#F08B78',
        gold: '#E7BB59',
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        card: '12px',
        pill: '9999px',
      },
      boxShadow: {
        soft: '0 4px 20px -4px rgba(23, 107, 58, 0.08)',
        card: '0 1px 3px 0 rgba(32, 51, 41, 0.06), 0 1px 2px -1px rgba(32, 51, 41, 0.04)',
      },
      animation: {
        'pulse-soft': 'pulse-soft 3s ease-in-out infinite',
        'fade-in': 'fadeIn 0.4s ease-out forwards',
        'slide-up': 'slideUp 0.4s ease-out forwards',
        'toast-in': 'toastIn 0.3s ease-out forwards',
      },
      keyframes: {
        'pulse-soft': {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.85', transform: 'scale(1.02)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        toastIn: {
          '0%': { opacity: '0', transform: 'translateX(100%)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
      },
    },
  },
  plugins: [],
};
