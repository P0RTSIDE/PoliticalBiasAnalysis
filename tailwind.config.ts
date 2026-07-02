import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#0F0F0F",
        surface: "#1A1A1A",
        "left-blindspot": "#3B82F6",
        "right-blindspot": "#EF4444",
        balanced: "#6B7280",
        "text-primary": "#F9FAFB",
        "text-secondary": "#9CA3AF",
        highlight: "#F59E0B",
        hairline: "#2A2A2A",
      },
      fontFamily: {
        display: ["var(--font-playfair)", "Georgia", "serif"],
        body: ["var(--font-inter)", "system-ui", "sans-serif"],
        mono: ["var(--font-jetbrains)", "ui-monospace", "monospace"],
      },
      keyframes: {
        "cell-in": {
          "0%": { opacity: "0", transform: "scale(0.6)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        "fade-in": {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "slide-in": {
          "0%": { transform: "translateX(100%)" },
          "100%": { transform: "translateX(0)" },
        },
        "fade-backdrop": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
      },
      animation: {
        "cell-in": "cell-in 0.4s cubic-bezier(0.2, 0.8, 0.2, 1) both",
        "fade-in": "fade-in 0.5s ease-out both",
        "slide-in": "slide-in 0.3s cubic-bezier(0.2, 0.8, 0.2, 1) both",
        "fade-backdrop": "fade-backdrop 0.25s ease-out both",
      },
    },
  },
  plugins: [],
};

export default config;
