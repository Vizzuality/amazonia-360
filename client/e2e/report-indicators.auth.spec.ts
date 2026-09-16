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
