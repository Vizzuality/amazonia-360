import { type Page, expect } from "@playwright/test";

/**
 * Stamps a DOM node so a later assertion can tell "the same node" from "a rebuilt one".
 *
 * React drops the attribute along with the element it was on, so a mark that is still
 * there is proof the subtree was never torn down — which is the whole claim a silent
 * module switch makes, and the only one a URL assertion cannot make for it.
 */
export async function markNode(page: Page, selector: string) {
  const node = page.locator(selector).first();
  await expect(node).toBeVisible({ timeout: 30_000 });
  await node.evaluate((element: HTMLElement) => {
    element.dataset.e2eKept = "yes";
  });
}

/** Fails if the node matching `selector` is not the one `markNode` stamped. */
export async function expectNodeKept(page: Page, selector: string) {
  await expect(page.locator(`${selector}[data-e2e-kept="yes"]`).first()).toBeAttached();
}
