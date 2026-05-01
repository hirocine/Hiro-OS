import type { Config } from "tailwindcss";

/**
 * Hiro OS — Tailwind preset.
 *
 * Usage in tailwind.config.ts:
 *   import hiroPreset from "./handoff/tailwind-preset";
 *   export default { presets: [hiroPreset], content: [...], ... };
 *
 * Non-destructive: ADDS tokens as new keys (text-os-fg-1, bg-os-surface, etc.)
 * without removing Tailwind defaults. Existing classes keep working.
 */
const preset: Partial<Config> = {
  theme: {
    extend: {
      colors: {
        // Brand monochrome scale
        hf: {
          black: "#000000",
          "gray-1": "#141414",
          "gray-2": "#282828",
          "gray-3": "#3A3A3A",
          "gray-4": "#4C4C4C",
          "gray-5": "#AAAAAA",
          "gray-6": "#BCBCBC",
          "gray-7": "#D3D3D3",
          "gray-8": "#EAEAEA",
          white: "#FFFFFF",
          green: "#4CFF5C",        // Pantone 7487 C
          "green-1": "#46E84D",
          "green-2": "#40D340",
          "green-3": "#37BC37",
          "green-4": "#24A024",
          "green-soft": "#D6FFD9",
          "green-ink": "#0A2E0A",
        },
        // Semantic OS tokens — use these in components
        os: {
          bg: "#FAFAFA",
          surface: "#FFFFFF",
          "surface-2": "#F5F5F5",
          "surface-3": "#EAEAEA",
          line: "#EAEAEA",
          "line-2": "#D3D3D3",
          "line-3": "#BCBCBC",
          "fg-1": "#000000",
          "fg-2": "#3A3A3A",
          "fg-3": "#4C4C4C",
          "fg-4": "#AAAAAA",
          accent: "#37BC37",
          "accent-soft": "#D6FFD9",
          "accent-ink": "#0A2E0A",
          "accent-bright": "#4CFF5C",
          warn: "#B8860B",
          "warn-soft": "#FAF0D7",
          danger: "#C13030",
          "danger-soft": "#FBE7E7",
          info: "#1F6FB8",
          "info-soft": "#E1EDF8",
        },
      },
      fontFamily: {
        display: ['"Helvetica Now Display"', '"Helvetica Neue"', "Helvetica", "Arial", "sans-serif"],
        text:    ['"Helvetica Now Text"',    '"Helvetica Neue"', "Helvetica", "Arial", "sans-serif"],
        mono:    ["ui-monospace", '"SF Mono"', "Menlo", "Consolas", "monospace"],
      },
      fontSize: {
        // Override defaults so design system sizes are top-of-mind
        micro:   ["11px", { lineHeight: "1.45" }],
        xs:      ["12px", { lineHeight: "1.45" }],
        sm:      ["13px", { lineHeight: "1.45" }],
        base:    ["14px", { lineHeight: "1.45" }],
        md:      ["15px", { lineHeight: "1.5" }],
        lg:      ["17px", { lineHeight: "1.5" }],
        xl:      ["20px", { lineHeight: "1.3", letterSpacing: "-0.015em" }],
        "2xl":   ["24px", { lineHeight: "1.2", letterSpacing: "-0.02em" }],
        "3xl":   ["32px", { lineHeight: "1.1", letterSpacing: "-0.025em" }],
        "4xl":   ["44px", { lineHeight: "1.05", letterSpacing: "-0.03em" }],
        display: ["72px", { lineHeight: "1", letterSpacing: "-0.035em" }],
      },
      spacing: {
        // 4px base — keeps Tailwind defaults but adds explicit OS heights
        "row":       "36px",
        "row-dense": "30px",
        "row-tall":  "48px",
      },
      borderRadius: {
        // Force rectangular as default
        none: "0",
        sm: "0",
        DEFAULT: "0",
        md: "0",
        lg: "0",
        // Keep pill for badges and full for avatars
        pill: "9999px",
        full: "9999px",
      },
      boxShadow: {
        // Brand is flat. These are the ONLY allowed shadows.
        none: "none",
        pop: "0 12px 32px -12px rgba(0,0,0,0.18)",
        focus: "0 0 0 2px #37BC37",
      },
      letterSpacing: {
        label: "0.14em",
        eyebrow: "0.16em",
      },
    },
  },
};

export default preset;
