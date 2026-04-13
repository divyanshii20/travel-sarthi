import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Brand
        saffron: {
          DEFAULT: '#FF6B35',
          50: '#FFF3EE',
          100: '#FFE3D4',
          500: '#FF6B35',
          600: '#E55A25',
          700: '#C94A18',
        },
        teal: {
          DEFAULT: '#0B7A75',
          50: '#E6F4F3',
          100: '#C0E4E2',
          500: '#0B7A75',
          600: '#096560',
          700: '#074D49',
        },
        gold: {
          DEFAULT: '#F4A261',
          500: '#F4A261',
        },
        coral: {
          DEFAULT: '#FF6B6B',
          500: '#FF6B6B',
        },
        lavender: {
          DEFAULT: '#9B59B6',
          500: '#9B59B6',
        },
        // Background
        ivory: '#FDFCF9',
        card: '#F8F6F2',
        input: '#F0EDE6',
        // Text
        primary: '#1A1A2E',
        secondary: '#4A4A6A',
        muted: '#7A7A9A',
      },
      fontFamily: {
        display: ['Playfair Display', 'serif'],
        body: ['Raleway', 'sans-serif'],
      },
      fontSize: {
        xs: ['12px', { lineHeight: '1.5' }],
        sm: ['14px', { lineHeight: '1.5' }],
        base: ['16px', { lineHeight: '1.65' }],
        lg: ['18px', { lineHeight: '1.65' }],
        xl: ['20px', { lineHeight: '1.5' }],
        '2xl': ['24px', { lineHeight: '1.4' }],
        '3xl': ['30px', { lineHeight: '1.3' }],
        '4xl': ['36px', { lineHeight: '1.2' }],
        '5xl': ['48px', { lineHeight: '1.1' }],
      },
      boxShadow: {
        sm: '0 1px 3px rgba(26,26,46,0.06)',
        DEFAULT: '0 4px 12px rgba(26,26,46,0.08)',
        md: '0 8px 24px rgba(26,26,46,0.10)',
        lg: '0 16px 40px rgba(26,26,46,0.13)',
        xl: '0 24px 64px rgba(26,26,46,0.17)',
        saffron: '0 8px 24px rgba(255,107,53,0.28)',
        teal: '0 8px 24px rgba(11,122,117,0.25)',
      },
      borderRadius: {
        card: '16px',
        btn: '12px',
        xl: '16px',
        '2xl': '20px',
        '3xl': '24px',
      },
      animation: {
        'fade-in': 'fadeIn 0.4s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'marquee': 'marquee 30s linear infinite',
        'shimmer': 'shimmer 1.5s infinite',
      },
      keyframes: {
        fadeIn: {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        slideUp: {
          from: { opacity: '0', transform: 'translateY(16px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        marquee: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      backgroundImage: {
        shimmer: 'linear-gradient(90deg, #f0ede6 25%, #e8e5de 50%, #f0ede6 75%)',
      },
      screens: {
        xs: '375px',
        sm: '640px',
        md: '768px',
        lg: '1024px',
        xl: '1280px',
        '2xl': '1440px',
      },
    },
  },
  plugins: [],
} satisfies Config;
