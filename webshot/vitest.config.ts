import { defineConfig } from "vitest/config";

export const resolveAlias = {
  alias: {},
};

export default defineConfig({
  resolve: resolveAlias,
  test: {
    environment: "node",
    include: ["test/**/*.test.ts", "test/**/*.spec.ts"],
    exclude: ["**/node_modules/**", "**/dist/**"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html", "lcov"],
      include: ["src/**/*.ts"],
      exclude: [
        "**/*.test.ts",
        "**/*.spec.ts",
        "**/node_modules/**",
        "**/dist/**",
        "**/coverage/**",
        "./src/main.ts",
      ],
      // Thresholds for coverage reports
      thresholds: {
        statements: 80,
        branches: 80,
        functions: 80,
        lines: 80,
      },
    },
  },
});
