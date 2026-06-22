/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: {
          base: "#05050d",
          panel: "rgba(20, 22, 40, 0.55)",
          chip: "rgba(28, 30, 50, 0.65)",
          input: "rgba(15, 17, 32, 0.7)",
        },
        accent: {
          DEFAULT: "#7c6cff",
          hover: "#8e80ff",
          ring: "rgba(124, 108, 255, 0.35)",
        },
        line: {
          subtle: "rgba(255,255,255,0.06)",
          muted: "rgba(255,255,255,0.12)",
        },
      },
      boxShadow: {
        glow: "0 0 120px 40px rgba(120, 90, 240, 0.25)",
        chip: "0 1px 0 rgba(255,255,255,0.04) inset, 0 0 0 1px rgba(255,255,255,0.06)",
      },
      backgroundImage: {
        "radial-glow":
          "radial-gradient(60% 50% at 50% 50%, rgba(140, 100, 240, 0.35) 0%, rgba(120, 60, 200, 0.18) 35%, rgba(60, 30, 120, 0.08) 60%, transparent 75%)",
      },
      fontFamily: {
        sans: [
          "Inter",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Roboto",
          "sans-serif",
        ],
      },
    },
  },
  plugins: [],
};
