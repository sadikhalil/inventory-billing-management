/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#E6F1FB', 100: '#B5D4F4', 200: '#85B7EB',
          400: '#378ADD', 600: '#185FA5', 800: '#0C447C', 900: '#042C53',
        },
        success: { 50: '#EAF3DE', 500: '#1D9E75', 700: '#0F6E56' },
        warning: { 50: '#FAEEDA', 500: '#EF9F27', 700: '#854F0B' },
        danger: { 50: '#FCEBEB', 500: '#E24B4A', 700: '#A32D2D' },
      },
      fontFamily: {
        sans: ['Inter var', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
    },
  },
  plugins: [],
};
