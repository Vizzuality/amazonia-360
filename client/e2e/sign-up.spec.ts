import { test, expect } from "./fixtures";
import { dismissCookieConsent } from "./helpers/cookie-consent";
import { LOCALES } from "./helpers/locale";
import { SignUpPage } from "./pages/sign-up.page";

// --- Page rendering ---

test.describe("sign-up page rendering", () => {
  for (const locale of LOCALES) {
    test(`loads correctly for locale: ${locale}`, async ({ page }) => {
      const signUpPage = new SignUpPage(page, locale);
      await signUpPage.goto();
      await signUpPage.expectLoaded();
    });
  }
});

// --- Form validation ---

test.describe("sign-up form validation", () => {
  test("shows error for short name", async ({ page }) => {
    const signUpPage = new SignUpPage(page);
    await signUpPage.goto();
    await dismissCookieConsent(page);

    await signUpPage.fillName("A");
    await signUpPage.submit();
    await signUpPage.expectValidationError(/at least 2 characters/i);
  });

  test("shows error for invalid email", async ({ page }) => {
    const signUpPage = new SignUpPage(page);
    await signUpPage.goto();
    await dismissCookieConsent(page);

    await signUpPage.fillEmail("not-an-email");
    await signUpPage.submit();
    await signUpPage.expectValidationError(/valid email/i);
  });

  test("shows error for short password", async ({ page }) => {
    const signUpPage = new SignUpPage(page);
    await signUpPage.goto();
    await dismissCookieConsent(page);

    await signUpPage.fillPassword("12345");
    await signUpPage.submit();
    await signUpPage.expectValidationError(/at least 6 characters/i);
  });

  test("shows error when passwords don't match", async ({ page }) => {
    const signUpPage = new SignUpPage(page);
    await signUpPage.goto();
    await dismissCookieConsent(page);

    await signUpPage.fillName("Test User");
    await signUpPage.fillEmail("test@example.com");
    await signUpPage.fillPassword("password123");
    await signUpPage.fillConfirmPassword("differentpassword");
    await signUpPage.checkTerms();
    await signUpPage.submit();
    await signUpPage.expectValidationError(/don't match/i);
  });

  test("shows error when terms not accepted", async ({ page }) => {
    const signUpPage = new SignUpPage(page);
    await signUpPage.goto();
    await dismissCookieConsent(page);

    await signUpPage.fillName("Test User");
    await signUpPage.fillEmail("test@example.com");
    await signUpPage.fillPassword("password123");
    await signUpPage.fillConfirmPassword("password123");
    // Do not check terms
    await signUpPage.submit();
    await signUpPage.expectValidationError(/agree to the terms/i);
  });
});

// --- Navigation links ---

test.describe("sign-up navigation links", () => {
  test("sign-in link navigates to sign-in page", async ({ page }) => {
    const signUpPage = new SignUpPage(page);
    await signUpPage.goto();
    await dismissCookieConsent(page);

    await signUpPage.signInLink.click();
    await expect(page).toHaveURL(/\/auth\/sign-in/, { timeout: 15_000 });
  });
});
