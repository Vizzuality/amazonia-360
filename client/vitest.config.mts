import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { configDefaults } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/vitest.setup.ts"],
    clearMocks: true,
    coverage: {
      enabled: true,
      reportsDirectory: "coverage",
    },
    css: false,
    exclude: [...configDefaults.exclude, "e2e/**"],
  },
});
