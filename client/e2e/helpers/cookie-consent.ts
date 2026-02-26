import type { Page } from "@playwright/test";

/** Dismiss the cookies consent dialog regardless of locale. */
export async function dismissCookieConsent(page: Page) {
  // Button text varies by locale: Accept (en), Aceptar (es), Aceitar (pt)
  const acceptBtn = page.getByRole("button", { name: /^accept|^aceptar|^aceitar/i });
  await acceptBtn.click({ timeout: 5_000 }).catch(() => {});
  await acceptBtn.waitFor({ state: "hidden", timeout: 5_000 }).catch(() => {});
}
