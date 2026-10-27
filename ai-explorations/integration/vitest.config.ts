import path from "node:path";

import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { playwright } from "@vitest/browser-playwright";
import { defineConfig } from "vitest/config";

const root = path.resolve(import.meta.dirname, "..");

function getStub(name: string): string {
  return path.resolve(root, "integration/stubs", `${name}.ts`);
}

export default defineConfig({
  root,
  plugins: [tailwindcss(), react()],
  resolve: {
    // Server functions and the Start runtime need the Start Vite plugin; the browser tier swaps in inert stubs.
    alias: [
      { find: /^@tanstack\/react-start$/, replacement: getStub("react-start") },
      { find: "@/lib/auth/session.functions", replacement: getStub("session.functions") },
      { find: "@/lib/report/report.functions", replacement: getStub("report.functions") },
      { find: "@/", replacement: `${path.resolve(root, "src")}/` },
      { find: "@integration/", replacement: `${path.resolve(root, "integration")}/` },
    ],
  },
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
      VITE_URL: "http://localhost:3100",
      VITE_API_URL: "http://localhost:8000",
      VITE_API_KEY: "integration-test-api-key",
      VITE_ARCGIS_API_KEY: "integration-test-arcgis-key",
      VITE_FEATURE_FLAGS: "country-module",
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
