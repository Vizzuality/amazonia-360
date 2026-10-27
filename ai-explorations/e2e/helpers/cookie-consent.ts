import type { BrowserContext, Page } from "@playwright/test";

import { expectHydrated } from "./hydration";

// The dialog mounts after hydration, which the dev server can take well past five seconds for.
export async function dismissCookieConsent(page: Page) {
  await expectHydrated(page.locator("header").first());
  const acceptBtn = page.getByRole("button", { name: /^accept/i });
  await acceptBtn.click({ timeout: 5_000 }).catch(() => {});
  await acceptBtn.waitFor({ state: "hidden", timeout: 5_000 }).catch(() => {});
}

export async function presetCookieConsent(context: BrowserContext, baseURL: string) {
  await context.addCookies([{ name: "consent", value: "true", url: baseURL }]);
}
