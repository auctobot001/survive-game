/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        terminal: {
          green: '#00ff41',
          bg: '#0a0a0a',
          orange: '#ff6b00',
          red: '#ff0000',
          cyan: '#00d4ff',
          yellow: '#ffff00',
          dim: '#005c18',
        },
      },
      fontFamily: {
        mono: ['"Courier New"', 'Courier', 'monospace'],
      },
    },
  },
  plugins: [],
};
