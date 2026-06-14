/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'bs-primary': '#2D6BE4',
        'bs-primary-dark': '#1A4FA8',
        'bs-primary-light': '#EBF1FD',
        'bs-secondary': '#0EA5E9',
        'bs-success': '#16A34A',
        'bs-warning': '#D97706',
        'bs-danger': '#DC2626',
        'bs-neutral-50': '#F8FAFC',
        'bs-neutral-100': '#F1F5F9',
        'bs-neutral-200': '#E2E8F0',
        'bs-neutral-600': '#475569',
        'bs-neutral-900': '#0F172A',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [],
}
