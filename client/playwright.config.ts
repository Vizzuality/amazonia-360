import path from "node:path";
import { fileURLToPath } from "node:url";

import { defineConfig, devices } from "@playwright/test";
import dotenv from "dotenv";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load E2E test environment variables: .env.test.local overrides .env.test
// (dotenv does not overwrite existing values, so load local first)
dotenv.config({ path: path.resolve(__dirname, ".env.test.local") });
dotenv.config({ path: path.resolve(__dirname, ".env.test") });

const isCI = !!process.env.CI;

const API_URL = "http://localhost:8000";

export const AUTH_FILE = path.join(__dirname, "e2e", ".auth", "user.json");

export default defineConfig({
  testDir: "./e2e",
  outputDir: "./e2e/test-results",

  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 2 : 0,
  workers: isCI ? 1 : undefined,

  reporter: [["html", { outputFolder: "./e2e/playwright-report" }], ["list"]],

  use: {
    baseURL: process.env.BASE_URL ?? "http://localhost:3000",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },

  webServer: [
    {
      command: "uv run uvicorn app.main:app --host 0.0.0.0 --port 8000",
      cwd: path.resolve(__dirname, "../api"),
      url: `${API_URL}/health`,
      reuseExistingServer: !isCI,
      timeout: 30_000,
      stdout: "pipe",
      stderr: "pipe",
      env: {
        AUTH_TOKEN: process.env.NEXT_PUBLIC_API_KEY ?? "e2e-test-api-token",
        GRID_TILES_PATH: process.env.GRID_TILES_PATH ?? "/tmp/grid-tiles",
        OPENAI_TOKEN: process.env.OPENAI_TOKEN ?? "sk-dummy-openai-token-for-e2e",
      },
    },
    {
      command: "pnpm payload migrate && pnpm build && pnpm start",
      url: "http://localhost:3000",
      reuseExistingServer: !isCI,
      timeout: 180_000,
      stdout: "pipe",
      stderr: "pipe",
      env: {
        // Disable basic auth for E2E — must be explicit here because Next.js
        // loads .env.local (which may have BASIC_AUTH_ENABLED=true) during
        // next build, and Edge middleware inlines env values at build time.
        BASIC_AUTH_ENABLED: "false",
      },
    },
  ],

  projects: [
    {
      name: "setup",
      testMatch: /.*\.setup\.ts/,
    },
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
      testIgnore: /.*\.(setup\.ts|auth\.spec\.ts)/,
    },
    {
      name: "chromium-authenticated",
      use: { ...devices["Desktop Chrome"], storageState: AUTH_FILE },
      dependencies: ["setup"],
      testMatch: /.*\.auth\.spec\.ts/,
    },
  ],
});
