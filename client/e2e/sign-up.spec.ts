import { test, expect } from "@playwright/test";

import { dismissCookieConsent } from "./helpers/cookie-consent";

test.describe("sign-up page rendering", () => {
  test("loads correctly", async ({ page }) => {
    await page.goto("/en/auth/sign-up");
    await dismissCookieConsent(page);

    await expect(
      page.locator('[data-slot="card-title"]', { hasText: "Create an account" }),
    ).toBeVisible({ timeout: 15_000 });
    await expect(page.getByLabel("Full name")).toBeVisible();
    await expect(page.getByLabel("Email")).toBeVisible();
    await expect(page.getByLabel("Password", { exact: true })).toBeVisible();
    await expect(page.getByLabel("Confirm password")).toBeVisible();
    await expect(page.locator("#communityOptIn")).toBeVisible();
    await expect(page.getByRole("group", { name: "Countries of interest" })).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });
});
