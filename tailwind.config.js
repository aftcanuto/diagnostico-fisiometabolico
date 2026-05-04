/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eef6ff', 100: '#d9eaff', 200: '#bcd8ff', 300: '#8ebdff',
          400: '#5897ff', 500: '#2f72ff', 600: '#1854ed', 700: '#1441c2',
          800: '#153899', 900: '#17347a'
        },
        score: {
          bad: '#ef4444',
          mid: '#f59e0b',
          good: '#10b981'
        }
      },
      fontFamily: { sans: ['Inter', 'system-ui', 'sans-serif'] }
    }
  },
  plugins: []
};
