import path from "node:path";

import react from "@vitejs/plugin-react";
import { playwright } from "@vitest/browser-playwright";
import tsconfigPaths from "vite-tsconfig-paths";
import { defineConfig } from "vitest/config";

export default defineConfig({
  root: path.resolve(import.meta.dirname, ".."),
  plugins: [tsconfigPaths(), react()],
  define: { "process.env": "import.meta.env" },
  // payload's upload helpers import node builtins, which the browser optimizer cannot bundle.
  optimizeDeps: {
    exclude: ["payload"],
  },
  server: {
    preTransformRequests: false,
  },
  test: {
    include: ["src/**/*.integration.test.tsx"],
    env: {
      NEXT_PUBLIC_URL: "http://localhost:3000",
      NEXT_PUBLIC_API_URL: "http://localhost:8000",
      NEXT_PUBLIC_API_KEY: "integration-test-api-key",
      NEXT_PUBLIC_ARCGIS_API_KEY: "integration-test-arcgis-key",
      NEXT_PUBLIC_FEATURE_FLAGS: "country-module",
    },
    setupFiles: ["./integration/setup.ts"],
    testTimeout: 15_000,
    browser: {
      enabled: true,
      provider: playwright({ contextOptions: { timezoneId: "UTC" } }),
      headless: true,
      instances: [
        {
          name: "Desktop Chrome",
          browser: "chromium",
          viewport: { width: 1280, height: 720 },
        },
      ],
    },
  },
});
