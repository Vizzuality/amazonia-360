import { test } from "./fixtures";
import { dismissCookieConsent } from "./helpers/cookie-consent";
import { ForgotPasswordPage } from "./pages/forgot-password.page";

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
