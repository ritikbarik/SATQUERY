/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      colors: {
        space: "#030814",
        panel: "#0b1425",
        mint: "#56d486",
        cyan: "#39b8ff",
      },
    },
  },
  plugins: [],
};
