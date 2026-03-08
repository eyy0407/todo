/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  "#fff0f5",
          100: "#ffe0eb",
          200: "#ffc2d4",
          300: "#ff94b3",
          400: "#ff5c8d",
          500: "#ff2d6d",
          600: "#f0005a",
          700: "#c8004b",
          800: "#a8003f",
          900: "#8c0037",
        },
        surface: {
          50:  "#fafafa",
          100: "#f4f4f5",
          200: "#e4e4e7",
          300: "#d4d4d8",
          400: "#a1a1aa",
          500: "#71717a",
          600: "#52525b",
          700: "#3f3f46",
          800: "#27272a",
          900: "#18181b",
          950: "#09090b",
        },
      },
      fontFamily: {
        sans: ["var(--font-geist-sans)", "system-ui", "sans-serif"],
      },
      gridTemplateColumns: {
        "7": "repeat(7, minmax(0, 1fr))",
      },
    },
  },
  plugins: [],
};
