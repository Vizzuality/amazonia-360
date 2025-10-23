import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";
import { globalIgnores } from "eslint/config";
import eslintPluginPrettierRecommended from "eslint-plugin-prettier/recommended";
import pluginQuery from "@tanstack/eslint-plugin-query";
import importPlugin from "eslint-plugin-import";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    rules: {
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
    plugins: {
      importPlugin,
    },
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
            {
              pattern: "react",
              group: "builtin",
              position: "before",
            },
            {
              pattern: "react**",
              group: "builtin",
            },
            {
              pattern: "@react**",
              group: "builtin",
            },
            {
              pattern: "next",
              group: "builtin",
              position: "after",
            },
            {
              pattern: "next/**",
              group: "builtin",
              position: "after",
            },
            {
              pattern: "payload",
              group: "builtin",
              position: "after",
            },
            {
              pattern: "payload/**",
              group: "builtin",
              position: "after",
            },
            {
              pattern: "@payload-config",
              group: "builtin",
              position: "after",
            },
            {
              pattern: "@payloadcms/**",
              group: "builtin",
              position: "after",
            },
            {
              pattern: "node_modules/**",
              group: "builtin",
            },
            {
              pattern: "@/env.mjs",
              group: "internal",
              position: "before",
            },
            {
              pattern: "@/lib/**",
              group: "internal",
              position: "before",
            },
            {
              pattern: "@/store",
              group: "internal",
              position: "before",
            },
            {
              pattern: "@/store/**",
              group: "internal",
              position: "before",
            },
            {
              pattern: "@/services/**",
              group: "internal",
              position: "after",
            },
            {
              pattern: "@/types/**",
              group: "internal",
              position: "before",
            },
            {
              pattern: "@/app/**",
              group: "internal",
              position: "before",
            },
            {
              pattern: "@/constants/**",
              group: "internal",
              position: "before",
            },
            {
              pattern: "@/hooks/**",
              group: "internal",
              position: "before",
            },
            {
              pattern: "@/containers/**",
              group: "internal",
              position: "before",
            },
            {
              pattern: "@/components/**",
              group: "internal",
              position: "before",
            },
            {
              pattern: "@/styles/**",
              group: "internal",
            },
          ],
          pathGroupsExcludedImportTypes: ["react"],
        },
      ],
    },
    settings: {
      "import/resolver": {
        // You will also need to install and configure the TypeScript resolver
        // See also https://github.com/import-js/eslint-import-resolver-typescript#configuration
        typescript: true,
        node: true,
      },
    },
  },
  eslintPluginPrettierRecommended,
  ...pluginQuery.configs["flat/recommended"],
  // Ignores
  globalIgnores([
    "src/app/(payload)/",
    "src/cms/migrations/",
    "src/types/generated/",
    "next-env.d.ts",
  ]),
  {
    ignores: [".next/"],
  },
];

export default eslintConfig;
