import { type Page, expect } from "@playwright/test";

export const AMAZON_REGION = "Amazon Region";
export const ECUADOR = "Ecuador";

function getTrigger(page: Page) {
  return page.getByRole("button", { name: /select module/i });
}

async function openModuleSelector(page: Page) {
  const trigger = getTrigger(page);
  await expect(trigger).toBeVisible({ timeout: 30_000 });
  await trigger.click();
}

export async function switchModule(page: Page, name: string) {
  await openModuleSelector(page);
  await page.getByRole("link", { name: new RegExp(name) }).click();
}

export async function switchModuleInNewTab(
  page: Page,
  name: string,
  how: "modifier" | "middle" = "modifier",
) {
  await openModuleSelector(page);

  const [opened] = await Promise.all([
    page.context().waitForEvent("page"),
    page
      .getByRole("link", { name: new RegExp(name) })
      .click(how === "middle" ? { button: "middle" } : { modifiers: ["ControlOrMeta"] }),
  ]);

  await opened.waitForLoadState("domcontentloaded");
  return opened;
}

export async function expectActiveModule(page: Page, name: string) {
  await expect(getTrigger(page)).toContainText(name);
}
