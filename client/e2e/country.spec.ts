import { test, expect } from "./fixtures";
import { dismissCookieConsent } from "./helpers/cookie-consent";
import { countryPath } from "./helpers/locale";
import { expectNodeKept, markNode } from "./helpers/node-identity";
import { CountrySelector } from "./pages/country-selector.page";
import { HomePage } from "./pages/home.page";
import { ReportsPage } from "./pages/reports.page";

// ---------------------------------------------------------------------------
// What the URL promises
// ---------------------------------------------------------------------------

test.describe("the module in the URL", () => {
  test("switching adds the code and leaves the path and search params alone", async ({ page }) => {
    const selector = new CountrySelector(page);

    // `bbox` belongs to the map, which fits the requested extent to the viewport and
    // writes the result back — continuously, and down to fractions of a metre. `ref`
    // stands in for the params the picker has to carry across verbatim.
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

  // The Amazon Region is the path with nothing between the locale and the route, which is
  // what makes every URL minted before modules existed resolve without a redirect — the
  // shape printed on every PDF's QR code.
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
      // The tab you were on is untouched: this is not a switch.
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

  // `proxy.ts` leaves a code it does not know in the path, so the reader sees what they
  // typed. Nothing matches it, and the catch-all turns the miss into the translated 404.
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

// ---------------------------------------------------------------------------
// Nothing is rebuilt
// ---------------------------------------------------------------------------

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
    // A rebuild would replay every scroll animation on the way.
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

  /**
   * Moving between the report tool's panels shares a layout, so the ArcGIS view is never
   * torn down. `switchFirst` is the case this suite exists for: with the module in the
   * route tree it was a real navigation across a dynamic segment, and every one of these
   * hops rebuilt the map once you had chosen a country.
   */
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
