/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: {
          base: "#0f1115",
          panel: "#151821",
          raised: "#1c2030",
          sunken: "#0a0c12",
        },
        ink: {
          primary: "#e6e8ee",
          secondary: "#a6adbb",
          muted: "#6b7280",
        },
        line: {
          subtle: "#262b3a",
          strong: "#3b4255",
        },
        accent: {
          primary: "#7aa2f7",
          soft: "#283457",
        },
        status: {
          info: "#7dcfff",
          warn: "#e0af68",
          error: "#f7768e",
          ok: "#9ece6a",
        },
      },
      fontFamily: {
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "Monaco", "Consolas", "monospace"],
        sans: ["ui-sans-serif", "system-ui", "-apple-system", "Segoe UI", "Roboto", "sans-serif"],
      },
    },
  },
  plugins: [],
};
