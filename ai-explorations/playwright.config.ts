import { randomUUID } from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { defineConfig, devices } from "@playwright/test";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const isCI = !!process.env.CI;

const runId = randomUUID();

// Workers inherit the runner's env, so every worker seeds and signs in with the same per-run values.
for (const [role, prefix] of [
  ["user", "E2E_TEST_USER"],
  ["viewer", "E2E_TEST_VIEWER"],
  ["admin", "E2E_ADMIN"],
]) {
  process.env[`${prefix}_EMAIL`] ??= `e2e-${role}-${runId}@example.com`;
  process.env[`${prefix}_PASSWORD`] ??= randomUUID();
}

export const BASE_URL = process.env.BASE_URL ?? "http://localhost:3100";

export const AUTH_FILE = path.join(__dirname, "e2e", ".auth", "user.json");

export default defineConfig({
  testDir: "./e2e",
  outputDir: "./test-results",

  // The suite runs against `vite dev`, which transforms modules on first request and starves
  // hydration past two parallel browsers.
  timeout: 90_000,
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 2 : 0,
  workers: isCI ? 1 : 2,

  reporter: [["html", { outputFolder: "./playwright-report", open: "never" }], ["list"]],

  use: {
    baseURL: BASE_URL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },

  webServer: {
    command: "pnpm dev",
    url: `${BASE_URL}/favicon.ico`,
    reuseExistingServer: true,
    timeout: 300_000,
    stdout: "pipe",
    stderr: "pipe",
    env: {
      BASIC_AUTH_ENABLED: "false",
      VITE_E2E_BRIDGE: "true",
      E2E_SEED_SECRET: process.env.E2E_SEED_SECRET ?? "",
    },
  },

  projects: [
    {
      name: "catalogue",
      testMatch: /catalogue\.setup\.ts/,
    },
    {
      name: "setup",
      testMatch: /auth\.setup\.ts/,
      dependencies: ["catalogue"],
    },
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
      testIgnore: /\.(setup\.ts|auth\.spec\.ts)/,
      dependencies: ["catalogue"],
    },
    {
      name: "chromium-authenticated",
      use: { ...devices["Desktop Chrome"], storageState: AUTH_FILE },
      dependencies: ["setup"],
      testMatch: /\.auth\.spec\.ts/,
    },
  ],
});
