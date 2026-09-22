import { test, expect } from "@playwright/test";

import { skipWithoutCredentials } from "./helpers/credentials";

test.skip(skipWithoutCredentials, "E2E test user credentials not set");

test.describe("auth pages are closed to a signed-in user", () => {
  test("sign-in sends you to my-reports", async ({ page }) => {
    await page.goto("/en/auth/sign-in");

    await expect(page).toHaveURL(/\/private\/my-reports/, { timeout: 15_000 });
  });

  test("sign-up sends you to my-reports", async ({ page }) => {
    await page.goto("/en/auth/sign-up");

    await expect(page).toHaveURL(/\/private\/my-reports/, { timeout: 15_000 });
  });
});
