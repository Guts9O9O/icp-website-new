/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      screens: {
        // Portrait tablets (same query as the --u override in index.css)
        tall: { raw: '(orientation: portrait) and (max-width: 1100px)' },
      },
      colors: {
        icp: {
          red: '#781f1c',
          mist: '#c3bdb4',
          slate: '#47433e',
          taupe: '#66594d',
        },
      },
      fontFamily: {
        brand: ['"Segoe UI Light"', '"Segoe UI"', 'system-ui', 'sans-serif'],
      },
      fontWeight: {
        semilight: '300',
      },
    },
  },
  plugins: [],
};
