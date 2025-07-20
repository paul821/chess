//tailwind.config.js
/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
      './pages/**/*.{js,ts,jsx,tsx,mdx}',
      './components/**/*.{js,ts,jsx,tsx,mdx}',
      './app/**/*.{js,ts,jsx,tsx,mdx}',
    ],
    theme: {
      extend: {
        colors: {
          primary: '#000000',
          secondary: '#ffffff',
          gray: {
            100: '#f8f9fa',
            200: '#e9ecef',
            300: '#dee2e6',
            400: '#ced4da',
            500: '#adb5bd',
            600: '#6c757d',
            700: '#495057',
            800: '#343a40',
            900: '#212529'
          }
        },
        fontFamily: {
          'sans': ['Inter', 'system-ui', 'sans-serif'],
          'mono': ['Fira Code', 'monospace']
        }
      },
    },
    plugins: [],
  }