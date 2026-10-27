import { type Page, test, expect } from "@playwright/test";

import { dismissCookieConsent } from "./helpers/cookie-consent";
import { skipWithoutSeedSecret } from "./helpers/credentials";
import { seedOwnReport } from "./helpers/seed";

test.skip(skipWithoutSeedSecret, "E2E_SEED_SECRET not set");

const REPORT_TOOL_LINK = 'header a[href="/en/reports"]';

async function openOwnReport(page: Page, title: string) {
  const reportId = await seedOwnReport(page.request, title);
  await page.goto(`/en/reports/${reportId}`);
  await dismissCookieConsent(page);
  await expect(page.getByRole("heading", { name: title, level: 2 })).toBeVisible({
    timeout: 30_000,
  });
  return reportId;
}

async function renameReport(page: Page, title: string) {
  await page.getByRole("button", { name: "Edit", exact: true }).click();
  await page.locator("#title").fill(title);
  await page.locator('form#report-title button[type="submit"]').click();
  await expect(page.getByRole("heading", { name: title, level: 2 })).toBeVisible();
}

/** Stands in for the plain anchors Markdown summaries render, which no router Link wraps. */
async function addPlainAnchor(page: Page, href: string) {
  await page.evaluate((target) => {
    const anchor = document.createElement("a");
    anchor.href = target;
    anchor.textContent = "plain anchor";
    anchor.dataset.testid = "plain-anchor";
    document.querySelector("main")?.prepend(anchor);
  }, href);
  return page.getByTestId("plain-anchor");
}

test("a router link with unsaved changes asks first, and cancel stays", async ({ page }) => {
  const reportId = await openOwnReport(page, "Guarded by a link");
  await renameReport(page, "Unsaved title");

  await page.locator(REPORT_TOOL_LINK).first().click();
  const dialog = page.getByRole("alertdialog");
  await expect(dialog).toBeVisible();
  await expect(page).toHaveURL(`/en/reports/${reportId}`);

  await dialog.getByRole("button", { name: "Cancel" }).click();
  await expect(dialog).toBeHidden();
  await expect(page).toHaveURL(`/en/reports/${reportId}`);
  await expect(page.getByRole("heading", { name: "Unsaved title", level: 2 })).toBeVisible();

  await page.locator(REPORT_TOOL_LINK).first().click();
  await dialog.getByRole("button", { name: "Discard & continue" }).click();
  await expect(page).toHaveURL("/en/reports", { timeout: 30_000 });
});

test("a plain anchor with unsaved changes asks first, then leaves", async ({ page }) => {
  const reportId = await openOwnReport(page, "Guarded by an anchor");
  await renameReport(page, "Unsaved title");

  await (await addPlainAnchor(page, "/en/partners")).click();
  const dialog = page.getByRole("alertdialog");
  await expect(dialog).toBeVisible();
  await expect(page).toHaveURL(`/en/reports/${reportId}`);

  await dialog.getByRole("button", { name: "Discard & continue" }).click();
  await expect(page).toHaveURL("/en/partners", { timeout: 30_000 });
});

test("without changes, links leave straight away", async ({ page }) => {
  await openOwnReport(page, "Nothing to guard");

  await page.locator(REPORT_TOOL_LINK).first().click();
  await expect(page).toHaveURL("/en/reports", { timeout: 30_000 });
  await expect(page.getByRole("alertdialog")).toHaveCount(0);
});
