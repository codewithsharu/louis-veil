/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",  
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors:{
        "rabit-red":"#ea2e0e",
        "lv-bg-main": "#F3E8DA",
        "lv-bg-secondary": "#E8D8C3",
        "lv-gold": "#C6A46A",
        "lv-dark": "#3B2416",
        "lv-nude-pink": "#D9A6A0",
        "lv-champagne": "#D8BE8B",
      },
      fontFamily: {
        serif: ['"Cormorant Garamond"', 'Georgia', 'serif'],
        sans: ['"Montserrat"', 'sans-serif'],
        cinzel: ['"Cinzel"', 'serif'],
        heading: ['"Cormorant Garamond"', 'Georgia', 'serif'],
        body: ['"Montserrat"', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

