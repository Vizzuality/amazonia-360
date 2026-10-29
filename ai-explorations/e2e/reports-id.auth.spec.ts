import { type Page, test, expect } from "@playwright/test";

import { dismissCookieConsent } from "./helpers/cookie-consent";
import { skipWithoutSeedSecret } from "./helpers/credentials";
import { seedOwnReport } from "./helpers/seed";

test.skip(skipWithoutSeedSecret, "E2E_SEED_SECRET not set");

async function openReport(page: Page, reportId: string) {
  await page.goto(`/en/reports/${reportId}`);
  await dismissCookieConsent(page);

  await expect(page.locator("h2").first()).toBeVisible({ timeout: 30_000 });
}

test.describe("report view (authenticated owner)", () => {
  test("an owner's title edit survives a reload", async ({ page, request }) => {
    const reportId = await seedOwnReport(request, "Original Title");

    await openReport(page, reportId);
    await expect(page.getByRole("heading", { name: "Original Title", level: 2 })).toBeVisible({
      timeout: 10_000,
    });

    await page.getByRole("button", { name: "Edit", exact: true }).click();

    const titleInput = page.locator("#title");
    await expect(titleInput).toBeVisible({ timeout: 5_000 });
    await titleInput.clear();
    await titleInput.fill("Updated Title");
    await page.locator('form#report-title button[type="submit"]').click();

    await expect(page.getByRole("heading", { name: "Updated Title", level: 2 })).toBeVisible({
      timeout: 10_000,
    });

    // Wait for the PATCH, so the reload below proves persistence instead of racing it.
    const saved = page.waitForResponse(
      (response) =>
        response.request().method() === "PATCH" &&
        response.url().includes("/reports") &&
        response.ok(),
    );
    await page.getByRole("button", { name: "Save", exact: true }).click();
    await saved;

    await page.reload();
    await expect(page.locator("h2").first()).toBeVisible({ timeout: 30_000 });
    await expect(page.getByRole("heading", { name: "Updated Title", level: 2 })).toBeVisible({
      timeout: 10_000,
    });
  });

  test("duplicate action changes URL to new report", async ({ page, request }) => {
    const reportId = await seedOwnReport(request);

    await openReport(page, reportId);

    const originalUrl = page.url();

    await page.getByRole("button", { name: "Open menu" }).click();
    await page.getByRole("menuitem", { name: "Duplicate" }).click();

    await expect(page).toHaveURL(/\/reports\/[\w-]+/, { timeout: 30_000 });
    await expect(page).not.toHaveURL(originalUrl);
  });
});
