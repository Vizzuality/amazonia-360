import { test, expect } from "./fixtures";
import { dismissCookieConsent } from "./helpers/cookie-consent";
import { skipWithoutCredentials } from "./helpers/credentials";
import { SignInPage } from "./pages/sign-in.page";

const SOME_REPORT_ID = "00000000-0000-0000-0000-000000000000";

test.describe("signing in returns to the requested report", () => {
  test.skip(skipWithoutCredentials, "E2E test user credentials not set");

  test("lands back on the report the visitor asked for", async ({ page }) => {
    await page.goto(`/en/reports/${SOME_REPORT_ID}`);
    await expect(page).toHaveURL(/\/en\/auth\/sign-in\?redirectUrl=/, { timeout: 30_000 });
    await dismissCookieConsent(page).catch(() => {});

    const signInPage = new SignInPage(page);
    await signInPage.signIn(
      process.env.E2E_TEST_USER_EMAIL as string,
      process.env.E2E_TEST_USER_PASSWORD as string,
    );

    // A double-prefixed return URL passes every earlier check and fails only here.
    await expect(page).toHaveURL(`/en/reports/${SOME_REPORT_ID}`, { timeout: 30_000 });
  });
});
