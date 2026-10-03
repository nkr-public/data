/** Preset Tailwind partage : mappe les classes utilitaires vers les tokens CSS. */
/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["selector", '[data-theme="dark"], .dark'],
  theme: {
    extend: {
      colors: {
        background: "rgb(var(--color-background) / <alpha-value>)",
        surface: "rgb(var(--color-surface) / <alpha-value>)",
        foreground: "rgb(var(--color-foreground) / <alpha-value>)",
        "muted-foreground": "rgb(var(--color-muted-foreground) / <alpha-value>)",
        "foreground-muted": "rgb(var(--color-muted-foreground) / <alpha-value>)",
        primary: {
          DEFAULT: "rgb(var(--color-primary) / <alpha-value>)",
          hover: "rgb(var(--color-primary-hover, var(--color-primary)) / <alpha-value>)",
          foreground: "rgb(var(--color-primary-foreground) / <alpha-value>)"
        },
        "primary-foreground": "rgb(var(--color-primary-foreground) / <alpha-value>)",
        border: "rgb(var(--color-border) / <alpha-value>)",
        danger: {
          DEFAULT: "rgb(var(--color-danger) / <alpha-value>)",
          foreground: "#ffffff"
        },
        success: {
          DEFAULT: "rgb(var(--color-success) / <alpha-value>)",
          foreground: "#ffffff"
        },
        warning: {
          DEFAULT: "rgb(var(--color-warning) / <alpha-value>)",
          foreground: "#ffffff"
        }
      },
      borderRadius: {
        sm: "var(--radius-sm, 0.25rem)",
        md: "var(--radius-md, 0.5rem)",
        lg: "var(--radius-lg, 0.75rem)",
        xl: "1rem",
        "2xl": "1.5rem"
      },
      boxShadow: {
        primary: "var(--shadow-primary)",
        secondary: "var(--shadow-secondary)",
        hover: "var(--shadow-hover)",
        sm: "var(--shadow-sm, 0 1px 2px 0 rgb(0 0 0 / 0.05))",
        md: "var(--shadow-md, 0 4px 6px -1px rgb(0 0 0 / 0.1))",
        lg: "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)",
        xl: "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)"
      },
      fontFamily: {
        sans: "var(--font-sans, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Inter, sans-serif)",
        mono: "var(--font-mono, ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace)",
      },
    },
  },
  plugins: [],
};
