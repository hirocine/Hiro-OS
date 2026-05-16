import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";
import requireDsShell from "./eslint-rules/require-ds-shell.js";

// Local plugin for Hiro-OS-specific rules.
const hiroPlugin = {
  rules: {
    "require-ds-shell": requireDsShell,
  },
};

export default tseslint.config(
  { ignores: ["dist"] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
      hiro: hiroPlugin,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": [
        "warn",
        { allowConstantExport: true },
      ],
      "@typescript-eslint/no-unused-vars": "off",
      // Portal-rendered DS containers must include `ds-shell` so DS-scoped
      // styles cascade in. See eslint-rules/require-ds-shell.js for context.
      "hiro/require-ds-shell": "error",
    },
  },
  // Don't lint the shadcn primitives themselves — they live in components/ui
  // and *define* DialogContent/SheetContent etc. with no portal of their own.
  {
    files: ["src/components/ui/**/*.{ts,tsx}"],
    rules: {
      "hiro/require-ds-shell": "off",
    },
  }
);
