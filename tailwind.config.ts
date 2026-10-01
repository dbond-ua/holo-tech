import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "1rem",
    },
    extend: {
      colors: {
        canvas: {
          DEFAULT: "#fafafa",
          dark: "#0a0a0b",
        },
        surface: {
          DEFAULT: "#ffffff",
          dark: "#141416",
        },
        ink: {
          DEFAULT: "#0c0d0f",
          dark: "#f5f6f7",
        },
        muted: {
          DEFAULT: "#6b7078",
          dark: "#9a9ea6",
        },
        line: {
          DEFAULT: "#e9e9ec",
          dark: "#232327",
        },
        accent: {
          DEFAULT: "#2563ff",
          50: "#eef2ff",
          100: "#dfe6ff",
          400: "#5b7fff",
          500: "#2563ff",
          600: "#1a4cf0",
          700: "#153cc2",
        },
        volt: {
          DEFAULT: "#c6ff3d",
          600: "#a3e619",
        },
        ember: {
          DEFAULT: "#ff5a1f",
        },
      },
      fontFamily: {
        sans: [
          "var(--font-sans)",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "sans-serif",
        ],
      },
      borderRadius: {
        xl2: "1.25rem",
        xl3: "1.75rem",
      },
      boxShadow: {
        soft: "0 1px 2px rgba(12,13,15,0.04), 0 8px 24px -12px rgba(12,13,15,0.12)",
        softer: "0 1px 1px rgba(12,13,15,0.03), 0 2px 8px -2px rgba(12,13,15,0.06)",
        lift: "0 20px 50px -20px rgba(12,13,15,0.25)",
        "soft-dark": "0 1px 2px rgba(0,0,0,0.3), 0 8px 30px -10px rgba(0,0,0,0.6)",
      },
      maxWidth: {
        "8xl": "90rem",
        "9xl": "100rem",
      },
      keyframes: {
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        "slide-up": {
          from: { opacity: "0", transform: "translateY(16px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "slide-down": {
          from: { opacity: "0", transform: "translateY(-8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "scale-in": {
          from: { opacity: "0", transform: "scale(0.96)" },
          to: { opacity: "1", transform: "scale(1)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-400px 0" },
          "100%": { backgroundPosition: "400px 0" },
        },
        marquee: {
          from: { transform: "translateX(0)" },
          to: { transform: "translateX(-50%)" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.5s ease-out both",
        "slide-up": "slide-up 0.6s cubic-bezier(0.16,1,0.3,1) both",
        "slide-down": "slide-down 0.25s cubic-bezier(0.16,1,0.3,1) both",
        "scale-in": "scale-in 0.2s cubic-bezier(0.16,1,0.3,1) both",
        shimmer: "shimmer 1.6s infinite linear",
        marquee: "marquee 28s linear infinite",
      },
      transitionTimingFunction: {
        premium: "cubic-bezier(0.16, 1, 0.3, 1)",
      },
    },
  },
  plugins: [],
};

export default config;
