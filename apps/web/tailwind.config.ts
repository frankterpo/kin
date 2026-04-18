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
      },
      fontFamily: {
        sans: ["ui-sans-serif", "system-ui", "-apple-system"],
        serif: ["ui-serif", "Georgia", "Cambria", "serif"],
      },
    },
  },
  plugins: [],
} satisfies Config;
