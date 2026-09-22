import { type Page, test, expect } from "@playwright/test";

import { dismissCookieConsent } from "./helpers/cookie-consent";
import { skipWithoutCredentials } from "./helpers/credentials";

test.skip(skipWithoutCredentials, "E2E test user credentials not set");

async function openIndicatorsPanel(page: Page) {
  await page.goto("/en/reports/indicators");
  await dismissCookieConsent(page);

  const panel = page.getByRole("complementary");
  // The `img` tag, not the role: it keeps the search field's inline-SVG icon out of the set.
  const topicRows = panel.getByRole("button").filter({ has: page.locator("img") });

  await expect(panel.getByRole("heading", { name: "Indicators" })).toBeVisible({ timeout: 30_000 });
  await expect(topicRows.first()).toBeVisible({ timeout: 30_000 });
  await expect(panel.getByRole("button", { name: "Expand all" })).toBeVisible();
  await expect(panel.getByRole("button", { name: "Clear selection" })).toBeDisabled();

  return { panel, topicRows };
}

async function expectFirstTopicOpens(page: Page) {
  const { panel, topicRows } = await openIndicatorsPanel(page);

  const row = topicRows.first();
  await row.click();

  await expect(row).toHaveAttribute("aria-expanded", "true");
  await expect(panel.getByRole("button", { name: "Collapse all" })).toBeVisible();
}

test.describe("indicators panel", () => {
  test("lists the topics and opens one", async ({ page }) => {
    await expectFirstTopicOpens(page);
  });
});

test.describe("indicators panel on mobile", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("lists the topics and opens one", async ({ page }) => {
    await expectFirstTopicOpens(page);
  });
});

test.describe("adding an indicator", () => {
  const INDICATOR = "Altitude range";

  test("adds it to the selection and shows its description", async ({ page }) => {
    const { panel } = await openIndicatorsPanel(page);

    await panel.getByRole("button", { name: "Expand all" }).click();
    await expect(panel.getByRole("button", { name: "Collapse all" })).toBeVisible();

    // Innermost element holding both the name button and the toggle, which is what
    // separates an indicator row from the subtopic and topic rows wrapping it.
    const row = panel
      .locator("div")
      .filter({ has: page.getByRole("button", { name: INDICATOR, exact: true }) })
      .filter({ has: page.getByRole("switch") })
      .last();

    await row.scrollIntoViewIfNeeded();
    await row.getByRole("switch").click();
    await expect(row.getByRole("switch")).toBeChecked();
    await expect(panel.getByRole("button", { name: "Clear selection" })).toContainText("(1)");

    await row.getByRole("button").nth(1).click();

    const info = page.getByRole("dialog");
    await expect(info).toBeVisible();
    await expect(info).toContainText("Altitude Ranges");
  });
});
