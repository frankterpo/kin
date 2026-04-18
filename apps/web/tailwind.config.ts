import type { Config } from "tailwindcss";

export default {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#0E1014",
        paper: "#F6F4EE",
        kin: {
          50: "#F1F7F4",
          100: "#DDEEE5",
          500: "#2F8560",
          700: "#1F5A41",
          900: "#0F2F22",
        },
        warm: "#E8A87C",
        alert: "#D95C3B",
        wa: {
          bg: "#ECE5DD",
          header: "#075E54",
          headerText: "#FFFFFF",
          bubbleIn: "#FFFFFF",
          bubbleOut: "#DCF8C6",
          meta: "#667781",
          tick: "#53BDEB",
          accent: "#25D366",
        },
        concord: {
          aligned: "#34C759",
          mismatch: "#FF9F0A",
          alert: "#FF3B30",
        },
      },
      fontFamily: {
        sans: ["ui-sans-serif", "system-ui", "-apple-system"],
        serif: ["ui-serif", "Georgia", "Cambria", "serif"],
      },
      animation: {
        "pulse-soft": "pulseSoft 2.2s ease-in-out infinite",
        "wave-1": "wave 1.1s ease-in-out infinite",
        "wave-2": "wave 1.3s ease-in-out infinite 0.1s",
        "wave-3": "wave 0.9s ease-in-out infinite 0.2s",
        "wave-4": "wave 1.2s ease-in-out infinite 0.15s",
        "wave-5": "wave 1.0s ease-in-out infinite 0.25s",
      },
      keyframes: {
        pulseSoft: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.55" },
        },
        wave: {
          "0%, 100%": { transform: "scaleY(0.35)" },
          "50%": { transform: "scaleY(1)" },
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
