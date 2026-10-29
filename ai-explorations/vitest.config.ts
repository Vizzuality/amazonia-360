import path from "node:path";
import { fileURLToPath } from "node:url";

import { configDefaults, defineConfig } from "vitest/config";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const UNIT_EXCLUDE = [...configDefaults.exclude, "e2e/**", "src/**/*.integration.test.tsx"];

export default defineConfig({
  resolve: {
    alias: {
      "@/": `${path.resolve(__dirname, "src")}/`,
      "@integration/": `${path.resolve(__dirname, "integration")}/`,
      "@payload-config": path.resolve(__dirname, "src", "payload.config.ts"),
    },
  },
  test: {
    env: { SKIP_ENV_VALIDATION: "1", VITE_FEATURE_FLAGS: "country-module" },
    globals: true,
    clearMocks: true,
    css: false,
    setupFiles: ["./src/vitest.setup.ts"],
    projects: [
      {
        extends: true,
        test: {
          name: "node",
          environment: "node",
          include: ["src/**/*.test.ts"],
          exclude: UNIT_EXCLUDE,
        },
      },
      {
        extends: true,
        test: {
          name: "jsdom",
          environment: "jsdom",
          include: ["src/**/*.test.tsx"],
          exclude: UNIT_EXCLUDE,
        },
      },
    ],
  },
});
