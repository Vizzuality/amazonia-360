import { expect } from "@playwright/test";

import { test } from "./fixtures";
import { dismissCookieConsent } from "./helpers/cookie-consent";
import { skipWithoutCredentials } from "./helpers/credentials";
import { ReportIndicatorsPage } from "./pages/report-indicators.page";

// /reports/indicators is gated, so these run in the signed-in
// `chromium-authenticated` project.
test.skip(skipWithoutCredentials, "E2E test user credentials not set");

test.describe("indicators panel", () => {
  test("lists the topics and opens one", async ({ page }) => {
    const indicatorsPage = new ReportIndicatorsPage(page);

    await indicatorsPage.goto();
    await dismissCookieConsent(page);

    await indicatorsPage.expectLoaded();
    await indicatorsPage.expandFirstTopic();
  });
});

test.describe("indicators panel on mobile", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("lists the topics and opens one", async ({ page }) => {
    const indicatorsPage = new ReportIndicatorsPage(page);

    await indicatorsPage.goto();
    await dismissCookieConsent(page);

    await indicatorsPage.expectLoaded();
    await indicatorsPage.expandFirstTopic();
  });
});

/**
 * The catalogue is served by the CMS, so this is also what proves an editor's content
 * reaches the UI: the name, the selection it drives and the description all come from
 * Postgres rather than from a JSON file compiled into the bundle.
 */
test.describe("adding an indicator", () => {
  const INDICATOR = "Altitude range";

  test("adds it to the selection and shows its description", async ({ page }) => {
    const indicatorsPage = new ReportIndicatorsPage(page);

    await indicatorsPage.goto();
    await dismissCookieConsent(page);
    await indicatorsPage.expectLoaded();

    await indicatorsPage.expandAll();
    await indicatorsPage.addIndicator(INDICATOR);
    await indicatorsPage.expectSelectionCount(1);

    const info = await indicatorsPage.openIndicatorInfo(INDICATOR);

    await expect(info).toContainText("Altitude Ranges");
  });
});
