import { test } from "./fixtures";
import { dismissCookieConsent } from "./helpers/cookie-consent";
import { ReportIndicatorsPage } from "./pages/report-indicators.page";

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
