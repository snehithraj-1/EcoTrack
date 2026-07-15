/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ["Syne", "sans-serif"],
        sans: ["DM Sans", "sans-serif"],
      },
      colors: {
        leaf: {
          50: "#f2fbf5",
          100: "#dff5e8",
          200: "#bfead1",
          300: "#91d9ae",
          400: "#5fc184",
          500: "#38a861",
          600: "#25884a",
          700: "#1f6c3d",
          800: "#1d5634",
          900: "#19472e",
        },
        earth: {
          50: "#f8f5ef",
          100: "#eee6d5",
          200: "#dcc8a8",
          300: "#c8a174",
          400: "#b98453",
          500: "#aa6f3f",
          600: "#915735",
          700: "#75432e",
          800: "#61382b",
          900: "#513026",
        },
      },
      boxShadow: {
        soft: "0 18px 45px rgba(22, 59, 43, 0.11)",
        card: "0 12px 30px rgba(24, 51, 39, 0.08)",
      },
    },
  },
  plugins: [],
};
