import { test, expect } from "@playwright/test";

import { dismissCookieConsent } from "./helpers/cookie-consent";
import { skipWithoutCredentials } from "./helpers/credentials";

const TEST_EMAIL = process.env.E2E_TEST_USER_EMAIL;
const TEST_PASSWORD = process.env.E2E_TEST_USER_PASSWORD;

test.describe("sign-in authentication errors", () => {
  test("shows error toast for wrong credentials", async ({ page }) => {
    await page.goto("/en/auth/sign-in");
    await dismissCookieConsent(page);

    await page.getByLabel("Email").fill("nonexistent@example.com");
    await page.getByLabel("Password").fill("wrongpassword123");
    await page.locator('button[type="submit"]').click();

    await expect(page.getByText(/failed to log in/i)).toBeVisible({ timeout: 30_000 });
  });
});

test.describe("protected route guard", () => {
  test("redirects back to original page after sign-in", async ({ page }) => {
    test.skip(skipWithoutCredentials, "E2E test user credentials not set");

    await page.goto("/en/private/profile");
    await expect(page).toHaveURL(/\/auth\/sign-in/, { timeout: 15_000 });

    await dismissCookieConsent(page);
    await expect(page).toHaveURL(/redirectUrl/);

    await page.getByLabel("Email").fill(TEST_EMAIL!);
    await page.getByLabel("Password").fill(TEST_PASSWORD!);
    await page.locator('button[type="submit"]').click();

    await expect(page).toHaveURL(/\/private\/profile/, { timeout: 15_000 });
  });
});

test.describe("sign-in from a gated link", () => {
  // Next prefetches /reports while signed out, so the client Router Cache holds the gate's
  // redirect back to sign-in and a soft navigation after signing in replays it.
  test("lands on the gated page and stays there", async ({ page }) => {
    test.skip(skipWithoutCredentials, "E2E test user credentials not set");

    await page.goto("/en");
    await expect(page.locator("h2").first()).toBeVisible({ timeout: 30_000 });
    await dismissCookieConsent(page);

    await page.locator('header a[href$="/reports"]').first().click();
    await expect(page).toHaveURL(/\/auth\/sign-in\?redirectUrl=%2Freports/, { timeout: 15_000 });

    await page.getByLabel("Email").fill(TEST_EMAIL!);
    await page.getByLabel("Password").fill(TEST_PASSWORD!);
    await page.locator('button[type="submit"]').click();

    await expect(page).toHaveURL(/\/reports/, { timeout: 15_000 });

    // The bug bounced you back a beat later, so the first match is not proof.
    await page.waitForLoadState("networkidle");
    await expect(page).toHaveURL(/\/reports/);

    await expect(page.getByRole("banner").locator('a[href*="/auth/sign-in"]')).toHaveCount(0);
  });
});
