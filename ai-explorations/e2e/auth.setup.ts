import { test as setup, expect } from "@playwright/test";

import { AUTH_FILE } from "../playwright.config";

import { fillSignInForm } from "./helpers/auth";
import { dismissCookieConsent } from "./helpers/cookie-consent";
import { getTestUser, skipWithoutSeedSecret } from "./helpers/credentials";
import { seedUser } from "./helpers/seed";

setup("authenticate as test user", async ({ page, request }) => {
  setup.skip(skipWithoutSeedSecret(), "E2E_SEED_SECRET not set");

  await seedUser(request, getTestUser());

  await page.goto("/en/auth/sign-in");
  await dismissCookieConsent(page);
  await fillSignInForm(page, getTestUser());

  await expect(page).toHaveURL(/\/private\/my-reports/, { timeout: 15_000 });

  await page.context().storageState({ path: AUTH_FILE });
});
