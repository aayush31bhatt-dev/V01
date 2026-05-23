import type { Config } from "tailwindcss";

export default {
  content: ["./src/renderer/**/*.{ts,tsx,html}"],
  theme: {
    extend: {
      colors: {
        canvas: "rgb(var(--color-canvas-rgb) / <alpha-value>)",
        ink: "rgb(var(--color-ink-rgb) / <alpha-value>)",
        muted: "rgb(var(--color-muted-rgb) / <alpha-value>)",
        line: "rgb(var(--color-line-rgb) / <alpha-value>)",
        panel: "rgb(var(--color-panel-rgb) / <alpha-value>)",
        surface: "rgb(var(--color-surface-rgb) / <alpha-value>)",
        brand: "rgb(var(--color-brand-rgb) / <alpha-value>)",
        accent: "rgb(var(--color-accent-rgb) / <alpha-value>)",
        terminal: "rgb(var(--color-terminal-rgb) / <alpha-value>)"
      },
      borderRadius: {
        sm: "var(--radius-sm)",
        md: "var(--radius-md)",
        lg: "var(--radius-lg)"
      },
      boxShadow: {
        soft: "0 2px 8px rgba(0, 0, 0, 0.12), 0 1px 3px rgba(0, 0, 0, 0.08)",
        elevated: "0 8px 32px rgba(0, 0, 0, 0.28), 0 2px 8px rgba(0, 0, 0, 0.15)",
        card: "0 16px 48px rgba(0, 0, 0, 0.35), 0 4px 12px rgba(0, 0, 0, 0.2)"
      },
      fontFamily: {
        sans: [
          "Inter",
          "Segoe UI Variable",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "sans-serif"
        ],
        mono: ["JetBrains Mono", "Fira Code", "SFMono-Regular", "Consolas", "Liberation Mono", "monospace"]
      },
      fontSize: {
        "2xs": ["10px", { lineHeight: "14px" }]
      }
    }
  },
  plugins: []
} satisfies Config;
