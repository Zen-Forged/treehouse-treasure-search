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
        forest: {
          50: "#f0f7f0",
          100: "#d9edd9",
          200: "#b4dab4",
          300: "#83c083",
          400: "#4fa04f",
          500: "#2d7d2d",
          600: "#1e5c1e",
          700: "#174517",
          800: "#123512",
          900: "#0c240c",
          950: "#061406",
        },
        bark: {
          50: "#faf6f0",
          100: "#f0e8d6",
          200: "#ddd0ad",
          300: "#c4b07d",
          400: "#a88f52",
          500: "#8a7038",
          600: "#6e5829",
          700: "#524020",
          800: "#3a2d17",
          900: "#241c0d",
        },
        amber: {
          400: "#fbbf24",
          500: "#f59e0b",
        },
      },
      fontFamily: {
        display: ["Georgia", "Cambria", "serif"],
        body: ["'Helvetica Neue'", "Helvetica", "Arial", "sans-serif"],
        mono: ["'Courier New'", "monospace"],
      },
      animation: {
        "fade-up": "fadeUp 0.4s ease-out forwards",
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "meter-fill": "meterFill 0.8s ease-out forwards",
        shimmer: "shimmer 2s infinite",
      },
      keyframes: {
        fadeUp: {
          from: { opacity: "0", transform: "translateY(16px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        meterFill: {
          from: { width: "0%" },
          to: { width: "var(--meter-width)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
    },
  },
  plugins: [],
};
