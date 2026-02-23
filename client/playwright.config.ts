import path from "node:path";
import { fileURLToPath } from "node:url";

import { defineConfig, devices } from "@playwright/test";
import dotenv from "dotenv";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load E2E test environment variables: .env.test.local overrides .env.test
// (dotenv does not overwrite existing values, so load local first)
dotenv.config({ path: path.resolve(__dirname, ".env.test.local") });
dotenv.config({ path: path.resolve(__dirname, ".env.test") });

const basicAuthUser = process.env.BASIC_AUTH_USER;
const basicAuthPassword = process.env.BASIC_AUTH_PASSWORD;

const isCI = !!process.env.CI;

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
    httpCredentials:
      basicAuthUser && basicAuthPassword
        ? { username: basicAuthUser, password: basicAuthPassword, send: "always" }
        : undefined,
  },

  projects: [
    {
      name: "setup",
      testMatch: /.*\.setup\.ts/,
    },
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
      testIgnore: /.*\.setup\.ts/,
    },
    {
      name: "chromium-authenticated",
      use: { ...devices["Desktop Chrome"], storageState: AUTH_FILE },
      dependencies: ["setup"],
      testMatch: /.*\.auth\.spec\.ts/,
    },
  ],
});
