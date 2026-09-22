import { test, expect } from "@playwright/test";

test.describe("homepage", () => {
  test("loads", async ({ page }) => {
    await page.goto("/en");

    await expect(page.locator("h2").first()).toBeVisible({ timeout: 30_000 });
  });
});
