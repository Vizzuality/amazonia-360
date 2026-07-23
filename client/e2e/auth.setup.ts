import { test as setup, expect } from "@playwright/test";

import { AUTH_FILE } from "../playwright.config";
import { dismissCookieConsent } from "./helpers/cookie-consent";

setup("authenticate as test user", async ({ page, request }) => {
  const email = process.env.E2E_TEST_USER_EMAIL;
  const password = process.env.E2E_TEST_USER_PASSWORD;

  if (!email || !password) {
    return setup.skip(
      !email || !password,
      "E2E_TEST_USER_EMAIL and E2E_TEST_USER_PASSWORD not set",
    );
  }

  // Seed the test user via the server endpoint when E2E_SEED_SECRET is set.
  // The endpoint must also have E2E_SEED_SECRET in its server environment.
  // If seeding fails (e.g. endpoint not available), continue and try to sign in.
  const seedSecret = process.env.E2E_SEED_SECRET;
  if (seedSecret) {
    try {
      const response = await request.post("/local-api/e2e/seed-user", {
        data: { email, password, secret: seedSecret },
      });

      if (response.ok()) {
        const result = await response.json();
        console.log(`Seed user result: ${result.status}`);
      } else {
        console.warn(
          `Seed endpoint returned ${response.status()} — user may need to exist already`,
        );
      }
    } catch {
      console.warn("Seed endpoint unreachable — user must already exist");
    }
  }

  await page.goto("/en/auth/sign-in");
  await dismissCookieConsent(page);

  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.locator('button[type="submit"]').click();

  await expect(page).toHaveURL(/\/private\/my-reports/, { timeout: 15_000 });

  await page.context().storageState({ path: AUTH_FILE });
});
