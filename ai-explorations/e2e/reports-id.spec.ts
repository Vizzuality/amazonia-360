import { test, expect } from "@playwright/test";

import { fillSignInForm } from "./helpers/auth";
import { dismissCookieConsent } from "./helpers/cookie-consent";
import { getTestUser, skipWithoutSeedSecret } from "./helpers/credentials";
import { seedUser } from "./helpers/seed";

const SOME_REPORT_ID = "00000000-0000-0000-0000-000000000000";

test.describe("signing in returns to the requested report", () => {
  test.skip(skipWithoutSeedSecret, "E2E_SEED_SECRET not set");

  test.beforeEach(async ({ request }) => {
    await seedUser(request, getTestUser());
  });

  test("lands back on the report the visitor asked for", async ({ page }) => {
    await page.goto(`/en/reports/${SOME_REPORT_ID}`);
    await expect(page).toHaveURL(/\/en\/auth\/sign-in\?redirectUrl=/, { timeout: 30_000 });
    await dismissCookieConsent(page);

    await fillSignInForm(page, getTestUser());

    // A double-prefixed return URL passes every earlier check and fails only here.
    await expect(page).toHaveURL(`/en/reports/${SOME_REPORT_ID}`, { timeout: 30_000 });
  });
});
