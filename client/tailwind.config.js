/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        kalam: ['Kalam', 'cursive'],
        patrick: ['"Patrick Hand"', 'cursive'],
      },
      colors: {
        papel: '#fdfbf7',
        lapiz: '#2d2d2d',
        velho: '#e5e0d8',
        marcador: '#ff4d4d',
        caneta: '#2d5da1',
      },
    },
  },
  plugins: [],
};
