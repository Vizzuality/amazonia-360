import { test, expect } from "./fixtures";
import { dismissCookieConsent } from "./helpers/cookie-consent";
import { skipWithoutCredentials } from "./helpers/credentials";
import { countryPath } from "./helpers/locale";
import { expectNodeKept, markNode } from "./helpers/node-identity";
import { CountrySelector } from "./pages/country-selector.page";
import { HomePage } from "./pages/home.page";
import { ReportsPage } from "./pages/reports.page";

// The picker lives in the header of the report tool, which is gated, so these run
// in the signed-in `chromium-authenticated` project.
test.skip(skipWithoutCredentials, "E2E test user credentials not set");

test.describe("the module in the URL", () => {
  test("the back button returns to the module you came from", async ({ page }) => {
    const selector = new CountrySelector(page);

    await page.goto(`${countryPath()}/reports/grid`);
    await dismissCookieConsent(page);

    await selector.switchTo("ECU");
    await expect(page).toHaveURL(/\/en\/ECU\/reports\/grid/);

    await page.goBack();
    await expect.poll(() => new URL(page.url()).pathname).toBe("/en/reports/grid");
    await selector.expectActiveCountry(null);
  });

  test("a reload stays in the module", async ({ page }) => {
    const selector = new CountrySelector(page);

    await page.goto(`${countryPath()}/reports/grid`);
    await dismissCookieConsent(page);

    await selector.switchTo("ECU");
    await expect(page).toHaveURL(/\/en\/ECU\/reports\/grid/);

    await page.reload();
    await selector.expectActiveCountry("ECU");
  });

  for (const how of ["modifier", "middle"] as const) {
    test(`a ${how === "middle" ? "middle click" : "cmd/ctrl-click"} opens the module in a new tab`, async ({
      page,
    }) => {
      const selector = new CountrySelector(page);

      await page.goto(`${countryPath()}/reports/grid`);
      await dismissCookieConsent(page);

      const opened = await selector.switchToInNewTab("ECU", how);

      await expect(opened).toHaveURL(/\/en\/ECU\/reports\/grid/);
      await expect.poll(() => new URL(page.url()).pathname).toBe("/en/reports/grid");
      await selector.expectActiveCountry(null);
    });
  }
});

test.describe("nothing is rebuilt", () => {
  test("switching module on the home page keeps it", async ({ page }) => {
    const homePage = new HomePage(page);
    const selector = new CountrySelector(page);

    await homePage.goto();
    await homePage.expectLoaded();
    await dismissCookieConsent(page);

    await markNode(page, "main");
    await selector.switchTo("ECU");

    await expect.poll(() => new URL(page.url()).pathname).toBe("/en/ECU");
    await expectNodeKept(page, "main");
    await selector.expectActiveCountry("ECU");
  });

  test("switching module in the report flow keeps the map", async ({ page }) => {
    const reportsPage = new ReportsPage(page);
    const selector = new CountrySelector(page);

    await reportsPage.goto();
    await reportsPage.expectLoaded();
    await dismissCookieConsent(page);

    await markNode(page, ".esri-view");
    await selector.switchTo("ECU");

    await expect(page).toHaveURL(/\/en\/ECU\/reports/);
    await expectNodeKept(page, ".esri-view");
  });

  const HOPS = [
    {
      name: "from the report tool to the grid",
      from: "/reports",
      click: (reports: ReportsPage) => reports.gridCard.click(),
      to: /\/reports\/grid/,
      switchFirst: false,
    },
    {
      name: "from the report tool to the indicators hub",
      from: "/reports",
      click: (reports: ReportsPage) => reports.indicatorsCard.click(),
      to: /\/reports\/indicators/,
      switchFirst: true,
    },
    {
      name: "from the grid back to the report tool",
      from: "/reports/grid",
      click: (reports: ReportsPage) => reports.backToReports.click(),
      to: /\/reports(\?|$)/,
      switchFirst: false,
    },
  ];

  for (const hop of HOPS) {
    const suffix = hop.switchFirst ? ", after switching module" : "";

    test(`moving ${hop.name} keeps the map${suffix}`, async ({ page }) => {
      const reports = new ReportsPage(page);
      const selector = new CountrySelector(page);

      await page.goto(`${countryPath()}${hop.from}`);
      await dismissCookieConsent(page);
      await expect(page.locator(".esri-view").first()).toBeVisible({ timeout: 30_000 });

      if (hop.switchFirst) {
        await selector.switchTo("ECU");
        await expect.poll(() => new URL(page.url()).pathname).toContain("/ECU/");
      }

      await markNode(page, ".esri-view");
      await hop.click(reports);

      await expect(page).toHaveURL(hop.to);
      await expectNodeKept(page, ".esri-view");
      await selector.expectActiveCountry(hop.switchFirst ? "ECU" : null);
    });
  }
});
