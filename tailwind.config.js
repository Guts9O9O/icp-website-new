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
          // Straight from the colour strip the designer prints on every R3
          // page. `red` was #781f1c, a touch more crimson than the spec.
          red: '#793220',
          mist: '#c3bdb4',
          slate: '#47433e',
          taupe: '#66594d',
          paper: '#ebe9e6', // the light page background R3 labels on About
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
