/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Outfit', 'Plus Jakarta Sans', 'Inter', 'sans-serif'],
        display: ['Outfit', 'sans-serif'],
      },
      colors: {
        skyBlue: "#87CEEB",
        softCyan: "#E0FFFF",
        glassWhite: "rgba(255, 255, 255, 0.25)",
        glassBorder: "rgba(255, 255, 255, 0.18)",
      },
      boxShadow: {
        glass: "0 8px 32px 0 rgba(31, 38, 135, 0.37)",
      },
      backdropBlur: {
        xs: "2px",
      }
    },
  },
  plugins: [],
}
