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
      await forgotPasswordPage.expectLoaded();
    });
  }
});

// --- Form validation ---

test.describe("forgot-password form validation", () => {
  test("shows error for invalid email", async ({ page }) => {
    const forgotPasswordPage = new ForgotPasswordPage(page);
    await forgotPasswordPage.goto();
    await dismissCookieConsent(page);

    await forgotPasswordPage.fillEmail("not-an-email");
    // Blur the email field to trigger onChange validation display
    await forgotPasswordPage.submitButton.click();
    await forgotPasswordPage.expectValidationError(/valid email/i);
  });
});

// --- Navigation links ---

test.describe("forgot-password navigation links", () => {
  test("back to sign in link navigates to sign-in page", async ({ page }) => {
    const forgotPasswordPage = new ForgotPasswordPage(page);
    await forgotPasswordPage.goto();
    await dismissCookieConsent(page);

    await forgotPasswordPage.backToSignInLink.click();
    await expect(page).toHaveURL(/\/auth\/sign-in/, { timeout: 15_000 });
  });
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
