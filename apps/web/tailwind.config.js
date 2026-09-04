/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["'Plus Jakarta Sans'", "'Noto Sans Devanagari'", "'Noto Sans Tamil'", "'Noto Sans Bengali'", "Inter", "system-ui", "sans-serif"],
        mono: ["'JetBrains Mono'", "monospace"],
      },
      colors: {
        background: "#f6f5f2", // Warm Paper Parchment
        canvasBg: "#fbfbfa",
        surface: "#ffffff",
        surfaceBorder: "#eae8e3",
        hairline: "#e7e5e0",
        slateText: {
          primary: "#111827",
          secondary: "#4b5563",
          muted: "#6b7280",
          faint: "#9ca3af",
        },
        bufferFlow: {
          coral: "#ff5b45",
          persimmon: "#f05138",
          amber: "#f59e0b",
          honey: "#fbbf24",
          emerald: "#10b981",
          sage: "#047857",
        },
        brand: {
          50: "#fff5f3",
          100: "#ffe8e4",
          200: "#ffd1cb",
          300: "#ff9788",
          400: "#ff7461",
          500: "#ff5b45", // BufferFlow Signature Coral
          600: "#f05138", // BufferFlow Persimmon
          700: "#d93820",
        },
        liquidity: {
          50: "#fffbeb",
          100: "#fef3c7",
          400: "#fbbf24",
          500: "#f59e0b", // Amber Gold
          600: "#d97706",
        },
        cyanBrand: {
          400: "#22d3ee",
          500: "#06b6d4",
          600: "#0891b2",
        },
        amberBrand: {
          400: "#fbbf24",
          500: "#f59e0b",
        },
        roseBrand: {
          500: "#f43f5e",
        }
      },
    },
  },
  plugins: [],
};
