/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#fff7ed',
          100: '#ffedd5',
          200: '#fed7aa',
          300: '#fdba74',
          400: '#fb923c',
          500: '#ff4d15', // Vibrant, mouthwatering food delivery orange (high contrast, ultra modern)
          600: '#ea3a00',
          700: '#c22d00',
          800: '#9a2400',
          900: '#7c2002',
        },
        accent: {
          amber: '#f59e0b',
          emerald: '#10b981',
          indigo: '#6366f1',
          rose: '#f43f5e',
        },
        ink: {
          DEFAULT: '#0f172a',
          muted: '#64748b',
          light: '#94a3b8',
        },
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Segoe UI', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 4px 20px -2px rgba(15, 23, 42, 0.06), 0 2px 6px -1px rgba(15, 23, 42, 0.04)',
        lift: '0 20px 35px -5px rgba(255, 77, 21, 0.2), 0 8px 16px -4px rgba(255, 77, 21, 0.12)',
        glow: '0 0 25px rgba(255, 77, 21, 0.35)',
        glass: '0 8px 32px 0 rgba(15, 23, 42, 0.08)',
      },
      animation: {
        float: 'float 3.5s ease-in-out infinite',
        'float-slow': 'float 5s ease-in-out infinite',
        'pulse-subtle': 'pulseSubtle 2.5s ease-in-out infinite',
        'bounce-subtle': 'bounceSubtle 2s ease-in-out infinite',
        'shimmer': 'shimmer 1.8s infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        pulseSubtle: {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.92', transform: 'scale(1.02)' },
        },
        bounceSubtle: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-4px)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '200% 0' },
          '100%': { backgroundPosition: '-200% 0' },
        },
      },
    },
  },
  plugins: [],
}
