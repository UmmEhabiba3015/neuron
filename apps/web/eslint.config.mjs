import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  /*
   * The browser's clock never makes a date (ADR-015). Only
   * lib/utils/clock.ts reads it, and it returns no Date and no timestamp.
   * `new Date(value)`, which reads a date it is given, stays allowed.
   */
  {
    files: ["**/*.{ts,tsx,mts,js,jsx,mjs}"],
    ignores: ["lib/utils/clock.ts"],
    rules: {
      "no-restricted-syntax": [
        "error",
        {
          selector: "NewExpression[callee.name='Date'][arguments.length=0]",
          message:
            "new Date() reads the clock. Only lib/utils/clock.ts may read it (ADR-015): the server decides dates.",
        },
        {
          selector: "MemberExpression[object.name='Date'][property.name='now']",
          message:
            "Date.now() reads the clock. Only lib/utils/clock.ts may read it (ADR-015): the server decides dates.",
        },
      ],
    },
  },
]);

export default eslintConfig;
