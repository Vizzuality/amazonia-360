import { test, expect } from "./fixtures";
import { dismissCookieConsent } from "./helpers/cookie-consent";
import { LOCALES } from "./helpers/locale";
import { ForgotPasswordPage } from "./pages/forgot-password.page";

// --- Page rendering ---

test.describe("forgot-password page rendering", () => {
  for (const locale of LOCALES) {
    test(`loads correctly for locale: ${locale}`, async ({ page }) => {
      const forgotPasswordPage = new ForgotPasswordPage(page, locale);
      await forgotPasswordPage.goto();
      await dismissCookieConsent(page);
      await forgotPasswordPage.expectLoaded();
    });
  }
});

// --- Happy path ---

test.describe("forgot-password happy path", () => {
  test("shows success toast for valid email submission", async ({ page }) => {
    const forgotPasswordPage = new ForgotPasswordPage(page);
    await forgotPasswordPage.goto();
    await dismissCookieConsent(page);

    // Payload forgotPassword succeeds even for non-existent emails (avoids user enumeration)
    await forgotPasswordPage.requestReset("any-user@example.com");
    await forgotPasswordPage.expectResetEmailSentToast();
  });
});
