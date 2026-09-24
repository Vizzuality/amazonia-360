import { defineConfig, configDefaults } from "vitest/config";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  test: {
    // Flagged features are off unless a build opts in, so their component tests have to opt
    // in too — otherwise they would pass against a component that renders nothing.
    env: { SKIP_ENV_VALIDATION: "1", NEXT_PUBLIC_FEATURE_FLAGS: "country-module" },
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/vitest.setup.ts"],
    clearMocks: true,
    coverage: {
      enabled: true,
      reportsDirectory: "coverage",
    },
    css: false,
    exclude: [...configDefaults.exclude, "e2e/**", "src/**/*.integration.test.tsx"],
  },
});
