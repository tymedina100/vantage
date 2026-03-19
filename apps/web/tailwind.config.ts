import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#0B0F1A",
        surface: "#141927",
        "surface-alt": "#1C2333",
        border: "#252D3D",
        primary: "#34D399",
        "primary-dim": "#064E3B",
        text: "#F1F5F9",
        muted: "#94A3B8",
        dim: "#475569",
        success: "#22C55E",
        warning: "#F59E0B",
        danger: "#EF4444",
        gold: "#FBBF24",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
