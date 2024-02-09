/** @type {import('tailwindcss').Config} */
export default {
  content: ["./app/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      borderColor: {
        DEFAULT: "black",
      },
    },
  },
  plugins: [],
};
