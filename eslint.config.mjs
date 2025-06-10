import js from "@eslint/js";
import babelParser from "@babel/eslint-parser";
import globals from "globals";
import { defineConfig } from "eslint/config";

export default defineConfig([
  {
    files: ["**/*.mjs"],
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.vitest,
      },
      parser: babelParser,
      parserOptions: {
        requireConfigFile: false,
        ecmaVersion: 2022,
      },
    },
    rules: {
      ...js.configs.recommended.rules,
    },
  },
]);
