import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      // Payo resets modal forms when they open and sets `loading` before fetching data,
      // both inside useEffect. That is intentional (same behaviour as the original app),
      // so this React Compiler performance hint is turned off.
      "react-hooks/set-state-in-effect": "off",
    },
  },
  {
    // Browser test scripts are plain Node.js (CommonJS) files
    files: ["e2e/**/*.js"],
    rules: { "@typescript-eslint/no-require-imports": "off" },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Plain service worker script (runs in the browser's service worker scope)
    "public/sw.js",
  ]),
]);

export default eslintConfig;
