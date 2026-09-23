import { type Page, expect } from "@playwright/test";

// Structural only: the badge's label is translated copy and the app ships en/es/pt.
const REGIONAL = "REGIONAL";

// Arriving in a module opens the welcome dialog, whose overlay swallows clicks on the badge.
// Pre-setting its cookie is what a returning visitor carries, and keeps copy out of the test.
export async function suppressCountryModuleDialog(page: Page, code: string) {
  await page.context().addCookies([
    {
      name: `country-module-dialog-${code}`,
      value: "true",
      url: page.url().startsWith("http") ? new URL(page.url()).origin : "http://localhost:3000",
    },
  ]);
}

export function getCountryBadge(page: Page) {
  return page.getByTestId("country-badge");
}

export async function expectActiveModule(page: Page, code: string) {
  await expect(getCountryBadge(page)).toHaveAttribute("data-country", code);
}

export async function expectRegionalModule(page: Page) {
  await expectActiveModule(page, REGIONAL);
}

export async function leaveModule(page: Page) {
  const exit = page.getByTestId("country-badge-exit");
  await expect(exit).toBeVisible({ timeout: 30_000 });
  await exit.click();
}

export async function leaveModuleInNewTab(page: Page, how: "modifier" | "middle" = "modifier") {
  const exit = page.getByTestId("country-badge-exit");
  await expect(exit).toBeVisible({ timeout: 30_000 });

  const [opened] = await Promise.all([
    page.context().waitForEvent("page"),
    exit.click(how === "middle" ? { button: "middle" } : { modifiers: ["ControlOrMeta"] }),
  ]);

  await opened.waitForLoadState("domcontentloaded");
  return opened;
}
