/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        icp: {
          red: '#781f1c',
          slate: '#47433e',
          taupe: '#66594d',
          mist: '#c3bdb4',
          text: '#d8d4cd',
          yellow: '#f6d22a'
        }
      },
      fontFamily: {
        brand: ['"Segoe UI Light"', '"Segoe UI"', 'system-ui', 'sans-serif']
      },
      fontWeight: {
        semilight: '300'
      },
      letterSpacing: {
        expanded: '0.14em'
      },
      animation: {
        'line-slide': 'lineSlide 2.8s ease-in-out infinite',
        'logo-pulse': 'logoPulse 2.6s ease-in-out infinite'
      },
      keyframes: {
        lineSlide: {
          '0%, 100%': { transform: 'translateX(-42px)', opacity: '0' },
          '14%': { opacity: '0.8' },
          '50%': { transform: 'translateX(0)', opacity: '1' },
          '86%': { opacity: '0.8' }
        },
        logoPulse: {
          '0%, 100%': { transform: 'scale(0.98)' },
          '50%': { transform: 'scale(1)' }
        }
      }
    }
  },
  plugins: []
};
