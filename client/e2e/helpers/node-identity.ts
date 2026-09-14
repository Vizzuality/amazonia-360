import { type Page, expect } from "@playwright/test";

// React drops the attribute along with the element it was on, so a mark that survives is
// proof the subtree was never torn down.
export async function markNode(page: Page, selector: string) {
  const node = page.locator(selector).first();
  await expect(node).toBeVisible({ timeout: 30_000 });
  await node.evaluate((element: HTMLElement) => {
    element.dataset.e2eKept = "yes";
  });
}

export async function expectNodeKept(page: Page, selector: string) {
  await expect(page.locator(`${selector}[data-e2e-kept="yes"]`).first()).toBeAttached();
}
