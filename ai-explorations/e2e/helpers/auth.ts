import { type BrowserContext, type Page, expect } from "@playwright/test";

import { dismissCookieConsent } from "./cookie-consent";
import { expectHydrated } from "./hydration";

type Credentials = { email: string; password: string };

export const USER_TOKEN_COOKIE = "ai-explorations-user-token";
export const ADMIN_TOKEN_COOKIE = "ai-explorations-token";

export async function fillSignInForm(page: Page, { email, password }: Credentials) {
  await expectHydrated(page.locator("form"));
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.locator('button[type="submit"]').click();
}

export async function signIn(page: Page, credentials: Credentials) {
  await page.goto("/en/auth/sign-in");
  await dismissCookieConsent(page);
  await fillSignInForm(page, credentials);
  await expect(page).toHaveURL(/\/en\/private\/my-reports/, { timeout: 30_000 });
}

export async function getTokenCookie(context: BrowserContext, name = USER_TOKEN_COOKIE) {
  return (await context.cookies()).find((cookie) => cookie.name === name);
}
