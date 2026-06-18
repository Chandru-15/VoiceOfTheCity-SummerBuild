import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig({
  theme: {
    extend: {
      colors: {
        voc: {
          bg: "#060a12",
          panel: "#0d1420",
          panel2: "rgba(255,255,255,0.04)",
          panel3: "rgba(255,255,255,0.07)",
          border: "rgba(255,255,255,0.08)",
          text: "#eef3f8",
          dim: "#8b97ab",
          teal: "#2dd4bf",
          green: "#34e0a1",
          cyan: "#38bdf8",
          purple: "#8b6cf6",
          pink: "#ec6fb0",
          amber: "#f5b94d",
          orange: "#f5894d",
          red: "#f0635f",
        },
      },
      fontFamily: {
        display: ['"Space Grotesk"', "sans-serif"],
        body: ["Inter", "-apple-system", "sans-serif"],
        mono: ['"JetBrains Mono"', "monospace"],
      },
      keyframes: {
        rise: {
          "0%": { opacity: 0, transform: "translateY(14px)" },
          "100%": { opacity: 1, transform: "translateY(0)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-6px)" },
        },
        "slide-in": {
          "0%": { opacity: 0, transform: "translateX(16px)" },
          "100%": { opacity: 1, transform: "translateX(0)" },
        },
        dash: {
          to: { strokeDashoffset: -20 },
        },
      },
      animation: {
        rise: "rise 0.6s ease both",
        "rise-delay": "rise 0.6s ease 0.1s both",
        float: "float 5s ease-in-out infinite",
        "float-delay": "float 5s ease-in-out infinite 1.2s",
        "slide-in": "slide-in 0.22s ease both",
        dash: "dash 6s linear infinite",
      },
    },
  },
  plugins: [react(), tailwindcss()],
});
