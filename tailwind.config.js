/** @type {import('tailwindcss').Config} */
export default {
    content: [
      "./pages/**/*.{js,jsx}",
      "./components/**/*.{js,jsx}",
    ],
    theme: {
      extend: {
        colors: {
          black: '#000000',
          white: '#FFFFFF',
        },
      },
    },
    plugins: [],
  };