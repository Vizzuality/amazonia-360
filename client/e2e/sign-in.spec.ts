import { test, expect } from "./fixtures";
import { dismissCookieConsent } from "./helpers/cookie-consent";
import { LOCALES } from "./helpers/locale";
import { SignInPage } from "./pages/sign-in.page";

const TEST_EMAIL = process.env.E2E_TEST_USER_EMAIL;
const TEST_PASSWORD = process.env.E2E_TEST_USER_PASSWORD;
const hasCredentials = !!(TEST_EMAIL && TEST_PASSWORD);

// --- Page rendering ---

test.describe("sign-in page rendering", () => {
  for (const locale of LOCALES) {
    test(`loads correctly for locale: ${locale}`, async ({ page }) => {
      const signInPage = new SignInPage(page, locale);
      await signInPage.goto();
      await signInPage.expectLoaded();
    });
  }
});

// --- Form validation ---

test.describe("sign-in form validation", () => {
  test("shows error for invalid email", async ({ page }) => {
    const signInPage = new SignInPage(page);
    await signInPage.goto();
    await dismissCookieConsent(page);

    await signInPage.fillEmail("not-an-email");
    // Blur the email field to trigger validation
    await signInPage.passwordInput.click();
    await signInPage.expectValidationError(/valid email/i);
  });

  test("shows error for short password", async ({ page }) => {
    const signInPage = new SignInPage(page);
    await signInPage.goto();
    await dismissCookieConsent(page);

    await signInPage.fillPassword("12345");
    // Blur the password field to trigger validation
    await signInPage.emailInput.click();
    await signInPage.expectValidationError(/at least 6 characters/i);
  });

  test("shows errors for empty form submission", async ({ page }) => {
    const signInPage = new SignInPage(page);
    await signInPage.goto();
    await dismissCookieConsent(page);

    // Type then clear to trigger onChange validation with empty values
    await signInPage.fillEmail("x");
    await signInPage.fillEmail("");
    await signInPage.fillPassword("x");
    await signInPage.fillPassword("");

    await signInPage.expectValidationError(/valid email/i);
    await signInPage.expectValidationError(/at least 6 characters/i);
  });
});

// --- Authentication errors ---

test.describe("sign-in authentication errors", () => {
  test("shows error toast for wrong credentials", async ({ page }) => {
    const signInPage = new SignInPage(page);
    await signInPage.goto();
    await dismissCookieConsent(page);

    await signInPage.signIn("nonexistent@example.com", "wrongpassword123");
    await signInPage.expectLoginFailedToast();
  });

  test("shows error toast for correct email with wrong password", async ({ page }) => {
    test.skip(!hasCredentials, "E2E_TEST_USER_EMAIL not set");
    const signInPage = new SignInPage(page);
    await signInPage.goto();
    await dismissCookieConsent(page);

    await signInPage.signIn(TEST_EMAIL!, "definitelywrongpassword");
    await signInPage.expectLoginFailedToast();
  });
});

// --- Happy path ---

test.describe("sign-in happy path", () => {
  test("redirects to my-reports after successful sign-in", async ({ page }) => {
    test.skip(!hasCredentials, "E2E test user credentials not set");
    const signInPage = new SignInPage(page);
    await signInPage.goto();
    await dismissCookieConsent(page);

    await signInPage.signIn(TEST_EMAIL!, TEST_PASSWORD!);
    await signInPage.expectRedirectedTo(/\/private\/my-reports/);
  });

  test("redirects to custom redirectUrl after successful sign-in", async ({ page }) => {
    test.skip(!hasCredentials, "E2E test user credentials not set");
    const signInPage = new SignInPage(page);
    await signInPage.goto("/private/profile");
    await dismissCookieConsent(page);

    await signInPage.signIn(TEST_EMAIL!, TEST_PASSWORD!);
    await signInPage.expectRedirectedTo(/\/private\/profile/);
  });
});

// --- Protected route guard ---

test.describe("protected route guard", () => {
  test("redirects unauthenticated user from my-reports to sign-in", async ({ page }) => {
    await page.goto("/en/private/my-reports");
    await expect(page).toHaveURL(/\/auth\/sign-in/, { timeout: 15_000 });
  });

  test("redirects unauthenticated user from profile to sign-in", async ({ page }) => {
    await page.goto("/en/private/profile");
    await expect(page).toHaveURL(/\/auth\/sign-in/, { timeout: 15_000 });
  });

  test("redirects back to original page after sign-in", async ({ page }) => {
    test.skip(!hasCredentials, "E2E test user credentials not set");

    // Visit a protected page while unauthenticated
    await page.goto("/en/private/profile");
    await expect(page).toHaveURL(/\/auth\/sign-in/, { timeout: 15_000 });

    await dismissCookieConsent(page);

    // The redirectUrl should be set in the URL
    await expect(page).toHaveURL(/redirectUrl/);

    // Sign in
    const signInPage = new SignInPage(page);
    await signInPage.signIn(TEST_EMAIL!, TEST_PASSWORD!);

    // Should be redirected back to the original protected page
    await signInPage.expectRedirectedTo(/\/private\/profile/);
  });
});

// --- Navigation links ---

test.describe("sign-in navigation links", () => {
  test("forgot password link navigates to forgot-password page", async ({ page }) => {
    const signInPage = new SignInPage(page);
    await signInPage.goto();
    await dismissCookieConsent(page);

    await signInPage.forgotPasswordLink.click();
    await expect(page).toHaveURL(/\/auth\/forgot-password/, { timeout: 15_000 });
  });

  test("sign up link navigates to sign-up page", async ({ page }) => {
    const signInPage = new SignInPage(page);
    await signInPage.goto();
    await dismissCookieConsent(page);

    await signInPage.signUpLink.click();
    await expect(page).toHaveURL(/\/auth\/sign-up/, { timeout: 15_000 });
  });
});
