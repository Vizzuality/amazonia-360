import { test, expect } from "./fixtures";
import { dismissCookieConsent } from "./helpers/cookie-consent";
import { SignInPage } from "./pages/sign-in.page";

const hasCredentials = !!(process.env.E2E_TEST_USER_EMAIL && process.env.E2E_TEST_USER_PASSWORD);

// A report ID that need not exist: the gate runs in the layout, before the
// page looks the report up, so signed-out visitors cannot tell a real ID
// from a fake one.
const SOME_REPORT_ID = "00000000-0000-0000-0000-000000000000";

test.describe("report view requires authentication", () => {
  test("redirects a signed-out visitor to sign-in with a return URL", async ({ page }) => {
    await page.goto(`/en/reports/${SOME_REPORT_ID}`);

    await expect(page).toHaveURL(
      `/en/auth/sign-in?redirectUrl=${encodeURIComponent(`/reports/${SOME_REPORT_ID}`)}`,
      { timeout: 30_000 },
    );
  });

  test("gates the webshot PDF page too", async ({ page }) => {
    await page.goto(`/en/webshot/reports/${SOME_REPORT_ID}`);

    await expect(page).toHaveURL(
      `/en/auth/sign-in?redirectUrl=${encodeURIComponent(`/webshot/reports/${SOME_REPORT_ID}`)}`,
      { timeout: 30_000 },
    );
  });

  test("does not reveal whether a report ID exists", async ({ page }) => {
    // Both a well-formed and a nonsense ID must produce the same redirect.
    for (const id of [SOME_REPORT_ID, "definitely-not-a-report"]) {
      await page.goto(`/en/reports/${id}`);
      await expect(page).toHaveURL(/\/en\/auth\/sign-in\?redirectUrl=/, { timeout: 30_000 });
    }
  });

  test("signing in returns the visitor to the report they asked for", async ({ page }) => {
    test.skip(!hasCredentials, "E2E test user credentials not set");

    await page.goto(`/en/reports/${SOME_REPORT_ID}`);
    await expect(page).toHaveURL(/\/en\/auth\/sign-in\?redirectUrl=/, { timeout: 30_000 });
    await dismissCookieConsent(page).catch(() => {});

    const signInPage = new SignInPage(page);
    await signInPage.signIn(
      process.env.E2E_TEST_USER_EMAIL as string,
      process.env.E2E_TEST_USER_PASSWORD as string,
    );

    // The assertion that matters: back on the requested report, with a single
    // locale segment. A double-prefixed return URL passes every check above
    // and fails only here.
    await expect(page).toHaveURL(`/en/reports/${SOME_REPORT_ID}`, { timeout: 30_000 });
  });
});
