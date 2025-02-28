import type { Config } from "tailwindcss";

const config = {
  darkMode: ["class"],
  content: [
    "./src/components/**/*.{ts,tsx}",
    "./src/containers/**/*.{ts,tsx}",
    "./src/lib/**/*.tsx",
    "./src/app/**/*.{ts,tsx}",
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: {
        DEFAULT: "2rem", // Default padding for medium screens
        sm: "1rem", // Small screens
        md: "1rem", // Medium screens
        lg: "2rem", // Large screens
        xl: "4rem", // Extra large screens
        "2xl": "6rem", // Extra-extra large screens
        "3xl": "10rem", // Extra-extra-extra large screens
      },
    },
    extend: {
      screens: {
        xl: "1260px",
        "2xl": "1660px",
        "3xl": "1900px",
        tall: {
          raw: "(min-height: 800px)",
        },
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        blue: {
          "50": "#f0f4f6",
          "100": "#cbd8df",
          "200": "#94B4C4",
          "300": "#5E90A8",
          "400": "#196E8C",
          "500": "#004E70",
          "600": "#003E5A",
          "700": "#00374E",
          "800": "#002F43",
          "900": "#002738",
        },
        cyan: {
          "100": "#DBEDF8",
          "200": "#B7DBF2",
          "300": "#93CAEB",
          "400": "#6FB8E5",
          "500": "#009ADE",
          "600": "#4BA6DE",
          "700": "#35749B",
          "800": "#2D6485",
          "900": "#26536F",
        },
        gray: {
          "100": "#f2f2f2",
          "200": "#b3b3b3",
          "300": "#858585",
          "400": "#585858",
          "500": "#3b3b3b",
          "600": "#303030",
          "700": "#282828",
          "800": "#242424",
          "900": "#1e1e1e",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
        viridis: {
          100: "#FDE724",
          200: "#B6DE2B",
          300: "#6CCE5A",
          400: "#1F9D8A",
          500: "#26838F",
          600: "#31688E",
          700: "#3E4A89",
          800: "#482576",
          900: "#440154",
        },
      },
      backgroundImage: {
        viridis:
          "linear-gradient(to right, #440154, #482576, #3E4A89, #31688E, #26838F, #1F9D8A, #6CCE5A, #B6DE2B, #FDE724)",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: {
            height: "0",
          },
          to: {
            height: "var(--radix-accordion-content-height)",
          },
        },
        "accordion-up": {
          from: {
            height: "var(--radix-accordion-content-height)",
          },
          to: {
            height: "0",
          },
        },
        growWidth: {
          "0%": { width: "0", opacity: "0.5" },
          "100%": { width: "100%", opacity: "1" },
        },
        "left-to-right": {
          from: {
            opacity: "0",
            transform: "translateX(-100%)", // Starts off-screen on the left
          },
          to: {
            opacity: "1",
            transform: "translateX(0)",
          },
        },
        "right-to-left": {
          from: {
            opacity: "0",
            transform: "translateX(100%)",
          },
          to: {
            opacity: "1",
            transform: "translateX(0)",
          },
        },
        slideUp: {
          "0%": { transform: "translateY(300px)", opacity: "0" },
          "50%": { transform: "translateY(-150)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        slideDown: {
          "0%": { transform: "translateY(-300px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        zoomOut: {
          "0%": { transform: "scale(1.5)" },
          "100%": { transform: "scale(1)" },
        },
        rightBottomToLeftTop: {
          "0%": {
            transform: "translate(300px, 300px)",
            opacity: "0",
          },
          "100%": {
            transform: "translate(0, 0)",
            opacity: "1",
          },
        },
        halfRightBottomToLeftTop: {
          "0%": {
            transform: "translate(300px, 300px)",
            opacity: "0",
          },
          "100%": {
            transform: "translate(0, 0)",
            opacity: "1",
          },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "left-to-right": "left-to-right 0.8s ease-out",
        "right-to-left": "right-to-left 0.8s ease-out",
        "slide-up": "slideUp 1s ease-in forwards",
        "slide-down": "slideDown 1s ease-in forwards",
        "zoom-out": "zoomOut 1.5s ease-in-out",
        growWidth: "growWidth 1s ease-out forwards",
        "right-bottom-to-left-top": "rightBottomToLeftTop 0.8s ease-in-out forwards",
        "half-right-bottom-to-left-top":
          "halfRightBottomToLeftTop 0.8s cubic-bezier(0.25, 0.1, 0.25, 1) 0.1s forwards",
      },
      fontSize: {
        "2xs": ["0.625rem", "0.75rem"],
        "4xl": ["2.5rem", "3rem"],
      },
      width: {
        "popover-width": "var(--radix-popover-trigger-width)",
      },
      height: {
        "popover-height": "var(--radix-popover-trigger-height)",
      },
      letterSpacing: {
        ["wide-lg"]: "0.7px",
      },
    },
  },
  plugins: [require("tailwindcss-animate"), require("@tailwindcss/typography")],
} satisfies Config;

export default config;
