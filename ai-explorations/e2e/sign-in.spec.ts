import { test, expect } from "@playwright/test";

import { fillSignInForm } from "./helpers/auth";
import { dismissCookieConsent } from "./helpers/cookie-consent";
import { getTestUser, skipWithoutSeedSecret } from "./helpers/credentials";
import { seedUser } from "./helpers/seed";

test.describe("sign-in authentication errors", () => {
  test("shows error toast for wrong credentials", async ({ page }) => {
    await page.goto("/en/auth/sign-in");
    await dismissCookieConsent(page);

    await fillSignInForm(page, { email: "nonexistent@example.com", password: "wrongpassword123" });

    await expect(page.getByText(/failed to log in/i)).toBeVisible({ timeout: 30_000 });
  });
});

test.describe("signing in from a gate", () => {
  test.skip(skipWithoutSeedSecret, "E2E_SEED_SECRET not set");

  test.beforeEach(async ({ request }) => {
    await seedUser(request, getTestUser());
  });

  test("redirects back to original page after sign-in", async ({ page }) => {
    await page.goto("/en/private/profile");
    await expect(page).toHaveURL(/\/auth\/sign-in/, { timeout: 15_000 });

    await dismissCookieConsent(page);
    await expect(page).toHaveURL(/redirectUrl/);

    await fillSignInForm(page, getTestUser());

    await expect(page).toHaveURL(/\/private\/profile/, { timeout: 15_000 });
  });

  test("lands on the gated page from a header link and stays there", async ({ page }) => {
    await page.goto("/en");
    await expect(page.locator("h2").first()).toBeVisible({ timeout: 30_000 });
    await dismissCookieConsent(page);

    await page.locator('header a[href$="/reports"]').first().click();
    await expect(page).toHaveURL(/\/auth\/sign-in\?redirectUrl=%2Freports/, { timeout: 15_000 });

    await fillSignInForm(page, getTestUser());

    await expect(page).toHaveURL(/\/reports/, { timeout: 15_000 });

    // The bug bounced you back once the client session settled, so the first match is not proof.
    // The header drops its sign-in link only when that session resolves as signed in.
    await expect(page.locator("button").filter({ hasText: "Point" }).first()).toBeVisible({
      timeout: 30_000,
    });
    await expect(page.getByRole("banner").locator('a[href*="/auth/sign-in"]')).toHaveCount(0, {
      timeout: 15_000,
    });
    await expect(page).toHaveURL(/\/reports/);
  });
});
