// frontend/tailwind.config.js
module.exports = {
    darkMode: 'class',
    content: [
      "./**/*.{html,js}", 
    ],
    theme: {
      extend: {
        colors: {
          primary: {
            DEFAULT: '#8B5CF6',
            dark: '#7C3AED'
          },
          accent: {
            DEFAULT: '#F97316',
            dark: '#EA580C'
          }
        }
      },
    },
    plugins: [],
  }