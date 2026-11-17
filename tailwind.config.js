/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        bg: '#F3F8F4',
        surface: '#FFFFFF',
        green: {
          primary: '#169C5C',
          deep: '#0A6B3E',
          forest: '#0B3D26',
          soft: '#E9F7EE',
          mint: '#7BD3A0',
          sage: '#D5EBDD',
        },
        dark: '#13251B',
        secondary: '#5E7367',
        border: '#E3EDE6',
        success: '#189A5A',
        warning: '#D99B3C',
        attention: '#E0705F',
        gold: '#D8A84E',
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        card: '20px',
        control: '12px',
        pill: '9999px',
      },
      boxShadow: {
        soft: '0 18px 48px -28px rgba(11, 61, 38, 0.4)',
        card: '0 1px 2px rgba(16, 40, 28, 0.04), 0 12px 32px -22px rgba(16, 52, 33, 0.32)',
        lift: '0 2px 4px rgba(16, 40, 28, 0.05), 0 26px 50px -28px rgba(11, 80, 45, 0.4)',
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
