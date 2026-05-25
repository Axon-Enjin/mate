import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: "#FBFAF8",
        surface: "#FFFFFF",
        "surface-emphasis": "#F2F0EC",
        border: "#E4E0D8",
        primary: {
          DEFAULT: "#1E6F5C",
          hover: "#185A4A",
        },
        text: {
          DEFAULT: "#23211E",
          muted: "#6B6760",
        },
        success: "#1E6F5C",
        warning: "#B8860B",
        error: "#B23A2F",
        // Additional calendar colors
        blue: {
          50: "#EFF6FF",
          200: "#BFDBFE",
          500: "#3B82F6",
          700: "#1D4ED8",
        },
        purple: {
          50: "#FAF5FF",
          200: "#E9D5FF",
          500: "#A855F7",
          700: "#7E22CE",
        },
        amber: {
          50: "#FFFBEB",
          200: "#FDE68A",
          500: "#F59E0B",
          700: "#B45309",
        },
        rose: {
          50: "#FFF1F2",
          200: "#FECDD3",
          500: "#F43F5E",
          700: "#BE123C",
        },
        teal: {
          50: "#F0FDFA",
          200: "#99F6E4",
          500: "#14B8A6",
          700: "#0F766E",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "Inter", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "JetBrains Mono", "monospace"],
      },
      fontSize: {
        xs: ["13px", { lineHeight: "1.45" }],
        sm: ["13px", { lineHeight: "1.45" }],
        base: ["15px", { lineHeight: "1.55" }],
        lg: ["16px", { lineHeight: "1.4" }],
        xl: ["20px", { lineHeight: "1.3" }],
        "2xl": ["24px", { lineHeight: "1.25" }],
      },
      spacing: {
        "1": "4px",
        "2": "8px",
        "3": "12px",
        "4": "16px",
        "6": "24px",
        "8": "32px",
        "12": "48px",
      },
      borderRadius: {
        DEFAULT: "8px",
        lg: "12px",
      },
      boxShadow: {
        sm: "0 1px 2px rgba(0, 0, 0, 0.06)",
        DEFAULT: "0 4px 12px rgba(0, 0, 0, 0.10)",
        md: "0 4px 12px rgba(0, 0, 0, 0.10)",
        lg: "0 12px 32px rgba(0, 0, 0, 0.16)",
      },
      animation: {
        shimmer: "shimmer 1.5s linear infinite",
      },
      keyframes: {
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
