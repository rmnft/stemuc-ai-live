
import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px"
      }
    },
    extend: {
      colors: {
        border: "hsl(0, 0%, 15%)",
        input: "hsl(0, 0%, 15%)",
        ring: "hsl(0, 100%, 50%)",
        background: "hsl(0, 0%, 6%)",
        foreground: "hsl(0, 0%, 98%)",
        primary: {
          DEFAULT: "hsl(0, 100%, 50%)",
          foreground: "hsl(0, 0%, 98%)"
        },
        secondary: {
          DEFAULT: "hsl(0, 70%, 40%)",
          foreground: "hsl(0, 0%, 98%)"
        },
        destructive: {
          DEFAULT: "hsl(0, 84.2%, 60.2%)",
          foreground: "hsl(0, 0%, 98%)"
        },
        muted: {
          DEFAULT: "hsl(0, 0%, 14%)",
          foreground: "hsl(0, 0%, 80%)"
        },
        accent: {
          DEFAULT: "hsl(0, 70%, 40%)",
          foreground: "hsl(0, 0%, 98%)"
        },
        popover: {
          DEFAULT: "hsl(0, 0%, 8%)",
          foreground: "hsl(0, 0%, 98%)"
        },
        card: {
          DEFAULT: "hsl(0, 0%, 8%)",
          foreground: "hsl(0, 0%, 98%)"
        },
        sidebar: {
          DEFAULT: "hsl(0, 0%, 8%)",
          foreground: "hsl(0, 0%, 98%)",
          primary: "hsl(0, 100%, 50%)",
          "primary-foreground": "hsl(0, 0%, 98%)",
          accent: "hsl(0, 0%, 14%)",
          "accent-foreground": "hsl(0, 0%, 98%)",
          border: "hsl(0, 0%, 15%)",
          ring: "hsl(0, 100%, 50%)"
        }
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)"
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" }
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" }
        },
        "pulse-glow": {
          "0%, 100%": { 
            opacity: "1",
            filter: "brightness(1)" 
          },
          "50%": { 
            opacity: "0.8",
            filter: "brightness(1.2)" 
          }
        },
        "float": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" }
        },
        "wave": {
          "0%": { transform: "scaleY(0.2)" },
          "50%": { transform: "scaleY(1)" },
          "100%": { transform: "scaleY(0.2)" }
        },
        "particle-float": {
          "0%": { transform: "translateY(0) translateX(0)", opacity: "0" },
          "50%": { opacity: "1" },
          "100%": { transform: "translateY(-100px) translateX(20px)", opacity: "0" }
        }
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "pulse-glow": "pulse-glow 2s ease-in-out infinite",
        "float": "float 6s ease-in-out infinite",
        "wave": "wave 1.5s ease-in-out infinite",
        "particle-float": "particle-float 3s ease-out forwards"
      },
      backgroundImage: {
        "radial-gradient": "radial-gradient(circle, hsl(0, 50%, 8%), hsl(0, 0%, 6%))"
      },
      boxShadow: {
        "glow": "0 0 10px hsl(0, 100%, 50%), 0 0 20px rgba(255, 0, 0, 0.3)"
      },
      backdropBlur: {
        xs: "2px"
      }
    }
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
