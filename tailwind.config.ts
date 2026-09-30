import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        neon: {
          green: "#00ff41",
          dim: "#00b32d",
          dark: "#003b0f",
          glow: "#00ff4166"
        },
        cyber: {
          black: "#050608",
          darker: "#0a0c10",
          card: "#0f1219",
          border: "#1c2333",
          hover: "#151b28",
          text: "#e0e6ed",
          muted: "#6b7a90"
        }
      },
      fontFamily: {
        mono: [
          "ui-monospace",
          "SFMono-Regular",
          "Menlo",
          "Monaco",
          "Consolas",
          "Liberation Mono",
          "Courier New",
          "monospace"
        ]
      },
      boxShadow: {
        neon: "0 0 10px #00ff4140, 0 0 20px #00ff4120",
        "neon-strong": "0 0 15px #00ff4180, 0 0 30px #00ff4140",
        "neon-inner": "inset 0 0 10px #00ff4130"
      },
      animation: {
        "pulse-fast": "pulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "glitch": "glitch 1s infinite"
      }
    }
  },
  plugins: []
};

export default config;
