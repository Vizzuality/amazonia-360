import { randomUUID } from "node:crypto";

import { test, expect } from "@playwright/test";

import { TOKEN_COOKIE, fillSignInForm, getTokenCookie, signIn } from "./helpers/auth";
import { dismissCookieConsent } from "./helpers/cookie-consent";
import { getTestAdmin, getUniqueEmail, skipWithoutSeedSecret } from "./helpers/credentials";
import { getUserToken } from "./helpers/database";
import { expectHydrated } from "./helpers/hydration";
import { seedAdmin, seedUser } from "./helpers/seed";

test.skip(skipWithoutSeedSecret, "E2E_SEED_SECRET not set");

test("sign up, verify the email, sign in and sign out", async ({ page, context }) => {
  const user = { email: getUniqueEmail("e2e-sign-up"), password: randomUUID() };

  await page.goto("/en/auth/sign-up");
  await dismissCookieConsent(page);
  await expectHydrated(page.locator("form"));
  await page.locator("#name").fill("Signup Flow");
  await page.locator("#email").fill(user.email);
  await page.locator("#password").fill(user.password);
  await page.locator("#confirm-password").fill(user.password);
  await page.locator('button[type="submit"]').click();

  await expect(page).toHaveURL(
    `/en/auth/check-your-email?email=${encodeURIComponent(user.email)}`,
    { timeout: 30_000 },
  );

  await page.goto("/en/auth/sign-in");
  await fillSignInForm(page, user);
  await expect(page.getByText(/failed to log in/i)).toBeVisible({ timeout: 30_000 });
  expect(await getTokenCookie(context)).toBeUndefined();

  await page.goto(`/en/auth/verify-email?token=${getUserToken(user.email, "_verificationtoken")}`);
  await expectHydrated(page.getByRole("button", { name: "Confirm my email" }));
  await page.getByRole("button", { name: "Confirm my email" }).click();
  await expect(page.getByText("Your email has been verified")).toBeVisible({ timeout: 30_000 });

  await signIn(page, user);

  const cookie = await getTokenCookie(context);
  expect(cookie, `${TOKEN_COOKIE} is set after sign-in`).toBeDefined();
  expect(cookie?.httpOnly).toBe(true);
  expect(cookie?.sameSite).toBe("Lax");

  await page.getByRole("banner").getByRole("button", { name: "SF", exact: true }).click();
  await page.getByRole("menuitem", { name: "Logout" }).click();

  await expect(page).toHaveURL(/\/en\/auth\/sign-in/, { timeout: 30_000 });
  await expect.poll(() => getTokenCookie(context)).toBeUndefined();

  await page.goto("/en/private/my-reports");
  await expect(page).toHaveURL(
    `/en/auth/sign-in?redirectUrl=${encodeURIComponent("/private/my-reports")}`,
  );
});

test("forgot password, reset it and sign in with the new one", async ({
  page,
  context,
  request,
}) => {
  const email = getUniqueEmail("e2e-reset");
  const oldPassword = randomUUID();
  const newPassword = randomUUID();
  await seedUser(request, { email, password: oldPassword });

  await page.goto("/en/auth/forgot-password");
  await dismissCookieConsent(page);
  await expectHydrated(page.locator("form"));
  await page.getByLabel("Email").fill(email);
  await page.locator('button[type="submit"]').click();
  await expect(page.getByText(/password reset email sent successfully/i)).toBeVisible({
    timeout: 30_000,
  });

  await page.goto(`/en/auth/reset-password?token=${getUserToken(email, "reset_password_token")}`);
  await expectHydrated(page.locator("form"));
  await page.locator("#password").fill(newPassword);
  await page.locator("#confirm-password").fill(newPassword);
  await page.locator('button[type="submit"]').click();

  // Payload 4's reset signs the user in; the client sends them to sign in instead.
  await expect(page).toHaveURL(/\/en\/auth\/sign-in$/, { timeout: 30_000 });
  expect(await getTokenCookie(context)).toBeUndefined();

  await fillSignInForm(page, { email, password: oldPassword });
  await expect(page.getByText(/failed to log in/i)).toBeVisible({ timeout: 30_000 });

  await signIn(page, { email, password: newPassword });
});

test("an admin session does not open the frontend gates", async ({ page, context, request }) => {
  await seedAdmin(request, getTestAdmin());

  const login = await page.request.post("/v1/api/admins/login", { data: getTestAdmin() });
  expect(login.ok()).toBe(true);
  expect(await getTokenCookie(context), "the admin token shares the cookie").toBeDefined();

  await page.goto("/en/private/my-reports");
  await expect(page).toHaveURL(
    `/en/auth/sign-in?redirectUrl=${encodeURIComponent("/private/my-reports")}`,
    { timeout: 30_000 },
  );

  await page.goto("/en/reports");
  await expect(page).toHaveURL(`/en/auth/sign-in?redirectUrl=${encodeURIComponent("/reports")}`, {
    timeout: 30_000,
  });
});
