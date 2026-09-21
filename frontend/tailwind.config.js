/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
      },
      colors: {
        brand: {
          50: '#fff4ed',
          100: '#ffe6d5',
          200: '#ffc9a8',
          300: '#ffa470',
          400: '#ff7a38',
          500: '#fb5a15',
          600: '#ec3f0b',
          700: '#c42d0b',
          800: '#9c2510',
          900: '#7e2110',
        },
        ink: {
          50: '#f7f7f9',
          100: '#eeeef2',
          200: '#d9d9e2',
          300: '#b6b6c4',
          400: '#8b8b9e',
          500: '#6b6b80',
          600: '#525266',
          700: '#3f3f52',
          800: '#2a2a3a',
          900: '#18181f',
        },
      },
      boxShadow: {
        soft: '0 1px 2px 0 rgb(24 24 31 / 0.04), 0 8px 24px -8px rgb(24 24 31 / 0.10)',
        card: '0 1px 3px 0 rgb(24 24 31 / 0.06), 0 1px 2px -1px rgb(24 24 31 / 0.06)',
      },
      borderRadius: {
        xl2: '1.25rem',
      },
      screens: {
        xs: '380px',
      },
    },
  },
  plugins: [],
};
