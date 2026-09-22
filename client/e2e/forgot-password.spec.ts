import { test, expect } from "@playwright/test";

import { dismissCookieConsent } from "./helpers/cookie-consent";

test.describe("forgot-password happy path", () => {
  test("shows success toast for valid email submission", async ({ page }) => {
    await page.goto("/en/auth/forgot-password");
    await dismissCookieConsent(page);

    // Payload forgotPassword succeeds even for non-existent emails (avoids user enumeration)
    await page.getByLabel("Email").fill("any-user@example.com");
    await page.locator('button[type="submit"]').click();

    await expect(page.getByText(/password reset email sent successfully/i)).toBeVisible({
      timeout: 30_000,
    });
  });
});
