import type { Config } from "tailwindcss";

const config = {
  darkMode: ["class"],
  content: [
    "./src/components/**/*.{ts,tsx}",
    "./src/containers/**/*.{ts,tsx}",
    "./src/app/**/*.{ts,tsx}",
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "var(--border)",
        input: "var(--input)",
        ring: "var(--ring)",
        background: "var(--background)",
        foreground: "var(--foreground)",
        primary: {
          DEFAULT: "var(--primary)",
          foreground: "var(--primary-foreground)",
        },
        secondary: {
          DEFAULT: "var(--secondary)",
          foreground: "var(--secondary-foreground)",
        },
        destructive: {
          DEFAULT: "var(--destructive)",
          foreground: "var(--destructive-foreground)",
        },
        muted: {
          DEFAULT: "var(--muted)",
          foreground: "var(--muted-foreground)",
        },
        accent: {
          DEFAULT: "var(--accent)",
          foreground: "var(--accent-foreground)",
        },
        popover: {
          DEFAULT: "var(--popover)",
          foreground: "var(--popover-foreground)",
        },
        card: {
          DEFAULT: "var(--card)",
          foreground: "var(--card-foreground)",
        },
        blue: {
          50: "#F0F4F6",
          100: "#94A3B8",
          200: "#94B4C4",
          300: "#5E90A8",
          400: "#196E8C",
          500: "#004E70",
          600: "#003E5A",
          700: "#00374E",
          800: "#002F43",
          900: "#002738",
        },
        cyan: {
          100: "#DBEDF8",
          200: "#B7DBF2",
          300: "#93CAEB",
          400: "#6FB8E5",
          500: "#009ADE",
          600: "#4BA6DE",
          700: "#35749B",
          800: "#2D6485",
          900: "#26536F",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
      fontSize: {
        "4xl": ["2.5rem", "3rem"],
      },
      width: {
        "popover-width": "var(--radix-popover-trigger-width)",
      },
      height: {
        "popover-height": "var(--radix-popover-trigger-height)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;

export default config;
