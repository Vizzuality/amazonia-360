import { type Page, expect } from "@playwright/test";

// Structural only: the selector's label is translated copy and the app ships en/es/pt.
const REGIONAL = "REGIONAL";

// Arriving in a module opens the welcome dialog, whose overlay swallows clicks on the selector.
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

export function getCountrySelectorTrigger(page: Page) {
  return page.getByTestId("country-selector-trigger");
}

export async function expectActiveModule(page: Page, code: string) {
  await expect(getCountrySelectorTrigger(page)).toHaveAttribute("data-country", code);
}

export async function expectRegionalModule(page: Page) {
  await expectActiveModule(page, REGIONAL);
}

const REGIONAL_OPTION = `[data-testid="country-selector-option"][data-country="${REGIONAL}"]`;

async function openRegionalOption(page: Page) {
  const trigger = getCountrySelectorTrigger(page);
  await expect(trigger).toBeVisible({ timeout: 30_000 });
  await trigger.click();

  const option = page.locator(REGIONAL_OPTION);
  await expect(option).toBeVisible();
  return option;
}

export async function leaveModule(page: Page) {
  const option = await openRegionalOption(page);
  await option.click();
}

export async function leaveModuleInNewTab(page: Page, how: "modifier" | "middle" = "modifier") {
  const option = await openRegionalOption(page);

  const [opened] = await Promise.all([
    page.context().waitForEvent("page"),
    option.click(how === "middle" ? { button: "middle" } : { modifiers: ["ControlOrMeta"] }),
  ]);

  await opened.waitForLoadState("domcontentloaded");
  return opened;
}
