import pluginQuery from "@tanstack/eslint-plugin-query";
import { globalIgnores } from "eslint/config";
import importPlugin from "eslint-plugin-import";
import jsxA11y from "eslint-plugin-jsx-a11y";
import eslintPluginPrettierRecommended from "eslint-plugin-prettier/recommended";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import globals from "globals";
import tseslint from "typescript-eslint";

const eslintConfig = [
  globalIgnores([
    "dist/",
    ".tanstack/",
    "coverage/",
    "playwright-report/",
    "test-results/",
    ".vitest/",
    ".vitest-attachments/",
    "public/",
    "src/routeTree.gen.ts",
    "src/payload-types.ts",
    "src/app/_payload/importMap.js",
    "src/cms/migrations/",
  ]),
  {
    files: ["**/*.{js,jsx,mjs,ts,tsx,mts,cts}"],
    plugins: {
      react,
      "react-hooks": reactHooks,
      import: importPlugin,
      "jsx-a11y": jsxA11y,
    },
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        sourceType: "module",
        ecmaFeatures: { jsx: true },
      },
      globals: { ...globals.browser, ...globals.node },
    },
    settings: {
      react: { version: "detect" },
      "import/parsers": {
        "@typescript-eslint/parser": [".ts", ".mts", ".cts", ".tsx", ".d.ts"],
      },
      "import/resolver": {
        node: { extensions: [".js", ".jsx", ".ts", ".tsx"] },
        typescript: { alwaysTryTypes: true },
      },
    },
    rules: {
      ...react.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,
      "import/no-anonymous-default-export": "warn",
      "react/no-unknown-property": "off",
      "react/react-in-jsx-scope": "off",
      "react/prop-types": "off",
      "jsx-a11y/alt-text": ["warn", { elements: ["img"], img: ["Image"] }],
      "jsx-a11y/aria-props": "warn",
      "jsx-a11y/aria-proptypes": "warn",
      "jsx-a11y/aria-unsupported-elements": "warn",
      "jsx-a11y/role-has-required-aria-props": "warn",
      "jsx-a11y/role-supports-aria-props": "warn",
      "react/jsx-no-target-blank": "off",
    },
  },
  ...tseslint.configs.recommended,
  {
    rules: {
      "@typescript-eslint/no-unused-expressions": "warn",
      "@typescript-eslint/ban-ts-comment": "warn",
      "@typescript-eslint/no-empty-object-type": "warn",
      "@typescript-eslint/no-explicit-any": "warn",
      "react-hooks/refs": "off",
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          vars: "all",
          args: "after-used",
          ignoreRestSiblings: false,
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          destructuredArrayIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^(_|ignore)",
        },
      ],
    },
  },
  {
    files: ["**/*.ts", "**/*.tsx"],
    rules: {
      "import/order": [
        "warn",
        {
          groups: ["builtin", "external", "internal", "parent", "sibling"],
          "newlines-between": "always",
          alphabetize: {
            order: "asc",
            caseInsensitive: true,
          },
          pathGroups: [
            { pattern: "react", group: "builtin", position: "before" },
            { pattern: "react**", group: "builtin" },
            { pattern: "@react**", group: "builtin" },
            { pattern: "@tanstack/react-start", group: "builtin", position: "after" },
            { pattern: "@tanstack/react-start/**", group: "builtin", position: "after" },
            { pattern: "@tanstack/react-router", group: "builtin", position: "after" },
            { pattern: "payload", group: "builtin", position: "after" },
            { pattern: "payload/**", group: "builtin", position: "after" },
            { pattern: "@payload-config", group: "builtin", position: "after" },
            { pattern: "@payloadcms/**", group: "builtin", position: "after" },
            { pattern: "node_modules/**", group: "builtin" },
            { pattern: "@/env", group: "internal", position: "before" },
            { pattern: "@/lib/**", group: "internal", position: "before" },
            { pattern: "@/store", group: "internal", position: "before" },
            { pattern: "@/store/**", group: "internal", position: "before" },
            { pattern: "@/services/**", group: "internal", position: "after" },
            { pattern: "@/types/**", group: "internal", position: "before" },
            { pattern: "@/app/**", group: "internal", position: "before" },
            { pattern: "@/constants/**", group: "internal", position: "before" },
            { pattern: "@/hooks/**", group: "internal", position: "before" },
            { pattern: "@/containers/**", group: "internal", position: "before" },
            { pattern: "@/components/**", group: "internal", position: "before" },
            { pattern: "@/styles/**", group: "internal" },
          ],
          pathGroupsExcludedImportTypes: ["react"],
        },
      ],
    },
  },
  {
    files: ["src/**/*.ts", "src/**/*.tsx"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "@/lib/auth/react",
              importNames: ["signOut"],
              message:
                "Sign out with useSignOut from @/lib/auth/use-sign-out, which reloads the page so no gated page rendered in this session stays in memory.",
            },
          ],
        },
      ],
    },
  },
  {
    files: ["src/lib/auth/use-sign-out.ts"],
    rules: {
      "no-restricted-imports": "off",
    },
  },
  eslintPluginPrettierRecommended,
  ...pluginQuery.configs["flat/recommended"],
];

export default eslintConfig;
