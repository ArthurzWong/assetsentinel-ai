import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        navy: {
          50: "#f4f6fb",
          100: "#e8edf7",
          200: "#cbd6ec",
          300: "#9fb3d9",
          400: "#6d8bc2",
          500: "#4a6cae",
          600: "#3a5591",
          700: "#304574",
          800: "#2b3d62",
          900: "#1d2c47",
          950: "#131e30",
        },
        teal: {
          50: "#f0fdfa",
          100: "#ccfbf1",
          200: "#99f6e4",
          300: "#5eead4",
          400: "#2dd4bf",
          500: "#14b8a6",
          600: "#0d9488",
          700: "#0f766e",
          800: "#115e59",
          900: "#134e4a",
        },
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "-apple-system", "Segoe UI", "Roboto", "Helvetica Neue", "Arial", "sans-serif"],
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "Consolas", "monospace"],
      },
      boxShadow: {
        card: "0 1px 2px 0 rgb(19 30 48 / 0.06), 0 1px 3px 0 rgb(19 30 48 / 0.08)",
        pop: "0 10px 30px -12px rgb(19 30 48 / 0.25)",
      },
    },
  },
  plugins: [],
};

export default config;
