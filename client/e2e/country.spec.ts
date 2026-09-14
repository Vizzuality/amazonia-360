import { test, expect } from "./fixtures";
import { dismissCookieConsent } from "./helpers/cookie-consent";
import { countryPath } from "./helpers/locale";
import { expectNodeKept, markNode } from "./helpers/node-identity";
import { CountrySelector } from "./pages/country-selector.page";
import { HomePage } from "./pages/home.page";
import { ReportsPage } from "./pages/reports.page";

test.describe("the module in the URL", () => {
  test("switching adds the code and leaves the path and search params alone", async ({ page }) => {
    const selector = new CountrySelector(page);

    await page.goto(`${countryPath()}/reports/grid?bbox=-70%2C-10%2C-60%2C0&ref=newsletter`);
    await dismissCookieConsent(page);

    await selector.expectActiveCountry(null);
    await selector.switchTo("ECU");

    await expect.poll(() => new URL(page.url()).pathname).toBe("/en/ECU/reports/grid");

    const params = new URL(page.url()).searchParams;
    expect(params.get("ref")).toBe("newsletter");
    expect(params.has("bbox")).toBe(true);

    await selector.expectActiveCountry("ECU");
  });

  test("the path with no code in it is the Amazon Region", async ({ page }) => {
    const selector = new CountrySelector(page);

    await page.goto(`${countryPath()}/reports/grid`);
    await dismissCookieConsent(page);

    expect(new URL(page.url()).pathname).toBe("/en/reports/grid");
    await selector.expectActiveCountry(null);
  });

  test("leaving a country returns to the unprefixed path", async ({ page }) => {
    const selector = new CountrySelector(page);

    await page.goto(`${countryPath("en", "ECU")}/reports/grid`);
    await dismissCookieConsent(page);
    await selector.expectActiveCountry("ECU");

    await selector.switchTo(null);

    await expect.poll(() => new URL(page.url()).pathname).toBe("/en/reports/grid");
    await selector.expectActiveCountry(null);
  });

  test("a lowercase code is redirected to the canonical uppercase one", async ({ page }) => {
    await page.goto("/en/ecu/reports/grid");
    await dismissCookieConsent(page);

    await expect.poll(() => new URL(page.url()).pathname).toBe("/en/ECU/reports/grid");
  });

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

  test("in-app links point at the new module straight away", async ({ page }) => {
    const homePage = new HomePage(page);
    const selector = new CountrySelector(page);

    await homePage.goto();
    await homePage.expectLoaded();
    await dismissCookieConsent(page);

    await selector.switchTo("ECU");

    await expect(homePage.reportToolLink).toHaveAttribute("href", "/en/ECU/reports");
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

  test("a country that is configured but not available is listed, not offered", async ({
    page,
  }) => {
    const selector = new CountrySelector(page);

    await page.goto(`${countryPath()}/reports/grid`);
    await dismissCookieConsent(page);

    await selector.expectComingSoon("SUR");
  });

  for (const segment of ["SUR", "XYZ"]) {
    test(`/en/${segment} is not found, with the code still in the address bar`, async ({
      page,
    }) => {
      const response = await page.goto(`/en/${segment}/reports`);

      expect(response?.status()).toBe(404);
      expect(new URL(page.url()).pathname).toBe(`/en/${segment}/reports`);
    });
  }

  test("routes that carry no module hide the picker", async ({ page }) => {
    const selector = new CountrySelector(page);

    await page.goto("/en/auth/sign-in");
    await dismissCookieConsent(page);

    await selector.expectNotVisible();
  });
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
    },
    {
      name: "from the report tool to the indicators hub",
      from: "/reports",
      click: (reports: ReportsPage) => reports.indicatorsCard.click(),
      to: /\/reports\/indicators/,
    },
    {
      name: "from the grid back to the report tool",
      from: "/reports/grid",
      click: (reports: ReportsPage) => reports.backToReports.click(),
      to: /\/reports(\?|$)/,
    },
  ];

  for (const hop of HOPS) {
    for (const switchFirst of [false, true]) {
      const suffix = switchFirst ? ", after switching module" : "";

      test(`moving ${hop.name} keeps the map${suffix}`, async ({ page }) => {
        const reports = new ReportsPage(page);
        const selector = new CountrySelector(page);

        await page.goto(`${countryPath()}${hop.from}`);
        await dismissCookieConsent(page);
        await expect(page.locator(".esri-view").first()).toBeVisible({ timeout: 30_000 });

        if (switchFirst) {
          await selector.switchTo("ECU");
          await expect.poll(() => new URL(page.url()).pathname).toContain("/ECU/");
        }

        await markNode(page, ".esri-view");
        await hop.click(reports);

        await expect(page).toHaveURL(hop.to);
        await expectNodeKept(page, ".esri-view");
        await selector.expectActiveCountry(switchFirst ? "ECU" : null);
      });
    }
  }
});
