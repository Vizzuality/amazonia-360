import type { Page } from "@playwright/test";

export async function dismissCookieConsent(page: Page) {
  const acceptBtn = page.getByRole("button", { name: /^accept/i });
  await acceptBtn.click({ timeout: 5_000 }).catch(() => {});
  await acceptBtn.waitFor({ state: "hidden", timeout: 5_000 }).catch(() => {});
}
