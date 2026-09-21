import { test, expect } from "./fixtures";
import { dismissCookieConsent } from "./helpers/cookie-consent";
import { HomePage } from "./pages/home.page";
import { SignInPage } from "./pages/sign-in.page";

const TEST_EMAIL = process.env.E2E_TEST_USER_EMAIL;
const TEST_PASSWORD = process.env.E2E_TEST_USER_PASSWORD;
const hasCredentials = !!(TEST_EMAIL && TEST_PASSWORD);

// --- Authentication errors ---

test.describe("sign-in authentication errors", () => {
  test("shows error toast for wrong credentials", async ({ page }) => {
    const signInPage = new SignInPage(page);
    await signInPage.goto();
    await dismissCookieConsent(page);

    await signInPage.signIn("nonexistent@example.com", "wrongpassword123");
    await signInPage.expectLoginFailedToast();
  });
});

// --- Protected route guard ---

test.describe("protected route guard", () => {
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

// --- Redirect loop regression ---

test.describe("sign-in from a gated link", () => {
  // Reaching sign-in through the header link is what breaks: Next prefetches
  // /reports while signed out, so the client Router Cache holds the gate's
  // redirect back to sign-in, and a soft navigation after signing in replays it.
  // Signing in through a Server Action evicts that cache first.
  test("lands on the gated page and stays there", async ({ page }) => {
    test.skip(!hasCredentials, "E2E test user credentials not set");

    const homePage = new HomePage(page);
    await homePage.goto();
    await dismissCookieConsent(page);

    await homePage.reportToolLink.click();
    await expect(page).toHaveURL(/\/auth\/sign-in\?redirectUrl=%2Freports/, { timeout: 15_000 });

    const signInPage = new SignInPage(page);
    await signInPage.signIn(TEST_EMAIL!, TEST_PASSWORD!);

    await expect(page).toHaveURL(/\/reports/, { timeout: 15_000 });

    // The bug let you touch /reports and bounced you back a beat later, so the first
    // match is not proof. Re-assert once the dust has settled.
    await page.waitForLoadState("networkidle");
    await expect(page).toHaveURL(/\/reports/);

    // And the header has to agree: the session the gate accepted is the one the client
    // is holding, without a reload. Keyed on the href, because a negative assertion on
    // translated copy passes under es/pt whether or not the button is there.
    await expect(page.getByRole("banner").locator('a[href*="/auth/sign-in"]')).toHaveCount(0);
  });
});
