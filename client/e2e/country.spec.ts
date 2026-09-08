import path from "node:path";
import { fileURLToPath } from "node:url";

import { test, expect } from "./fixtures";
import { mockArcGISFeatureServer } from "./helpers/arcgis-mock";
import { dismissCookieConsent } from "./helpers/cookie-consent";
import { AMAZON_REGION, countryPath } from "./helpers/locale";
import { CountrySelector } from "./pages/country-selector.page";
import { HomePage } from "./pages/home.page";
import { ReportsPage } from "./pages/reports.page";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const GEOJSON_FILE = path.resolve(__dirname, "fixtures/files/amazon-polygon.geojson");

// --- Switching country ---

test.describe("country switching", () => {
  test("swaps the segment and leaves the path and search params alone", async ({ page }) => {
    const selector = new CountrySelector(page);

    // `bbox` belongs to the map, which fits the requested extent to the viewport and
    // writes the result back — continuously, and down to fractions of a metre. `ref`
    // stands in for the params the picker has to carry across verbatim.
    await page.goto(`${countryPath()}/reports/grid?bbox=-70%2C-10%2C-60%2C0&ref=newsletter`);
    await dismissCookieConsent(page);

    await selector.expectActiveCountry(AMAZON_REGION);
    await selector.switchTo("ECU");

    await expect.poll(() => new URL(page.url()).pathname).toBe("/en/ECU/reports/grid");

    const params = new URL(page.url()).searchParams;
    expect(params.get("ref")).toBe("newsletter");
    expect(params.has("bbox")).toBe(true);

    await selector.expectActiveCountry("ECU");
  });

  test("the back button returns to the country you came from", async ({ page }) => {
    const selector = new CountrySelector(page);

    await page.goto(`${countryPath()}/reports/grid`);
    await dismissCookieConsent(page);

    await selector.switchTo("ECU");
    await expect(page).toHaveURL(/\/en\/ECU\/reports\/grid/);

    await page.goBack();
    await expect(page).toHaveURL(/\/en\/~\/reports\/grid/);
  });

  test("a drawn area survives the switch", async ({ page }) => {
    const reportsPage = new ReportsPage(page);
    const selector = new CountrySelector(page);

    await reportsPage.goto();
    await reportsPage.expectLoaded();
    await dismissCookieConsent(page);

    await reportsPage.drawPoint();
    await reportsPage.expectLocationCreated();

    await selector.switchTo("ECU");
    await expect(page).toHaveURL(/\/en\/ECU\/reports/);

    // The store lives above `[country]`, so the switch must not take the area with it.
    await reportsPage.expectLocationCreated();
    await reportsPage.expectBufferVisible();
  });

  test("an uploaded geometry survives the switch", async ({ page }) => {
    await mockArcGISFeatureServer(page);

    const reportsPage = new ReportsPage(page);
    const selector = new CountrySelector(page);

    await reportsPage.goto();
    await reportsPage.expectLoaded();
    await dismissCookieConsent(page);

    await reportsPage.uploadFile(GEOJSON_FILE);
    await reportsPage.expectLocationCreated();

    await selector.switchTo("ECU");
    await expect(page).toHaveURL(/\/en\/ECU\/reports/);

    await reportsPage.expectLocationCreated();
  });

  test("a country that is not yet available is listed but cannot be entered", async ({ page }) => {
    const homePage = new HomePage(page);
    const selector = new CountrySelector(page);

    await homePage.goto();
    await homePage.expectLoaded();
    await dismissCookieConsent(page);

    await selector.expectComingSoon("SUR");
  });

  test("the picker and country names are translated", async ({ page }) => {
    const selector = new CountrySelector(page, "es");

    await page.goto(`${countryPath("es")}/reports/grid`);
    await dismissCookieConsent(page);

    await selector.expectActiveCountry(AMAZON_REGION);
    await selector.switchTo("ECU");

    // The map appends its own `bbox` once the view settles, so pin the path only.
    await expect.poll(() => new URL(page.url()).pathname).toBe("/es/ECU/reports/grid");
    await selector.expectActiveCountry("ECU");
  });
});

// --- URL shapes ---

test.describe("country URLs", () => {
  test("a locale-only URL lands on the Amazon Region", async ({ page }) => {
    await page.goto("/en");
    await expect(page).toHaveURL("/en/~");
  });

  test("a URL minted before the segment existed still resolves", async ({ page }) => {
    await page.goto("/en/reports/grid");
    await expect(page).toHaveURL("/en/~/reports/grid");
  });

  test("a printed report link still resolves", async ({ page }) => {
    // Every PDF ever exported embeds a QR code of this shape. The redirect runs before
    // the route resolves, so whether the report exists is beside the point.
    await page.goto("/en/reports/a-report-from-a-printed-page");
    await expect(page).toHaveURL("/en/~/reports/a-report-from-a-printed-page");
  });

  test("a lowercase code redirects to uppercase", async ({ page }) => {
    await page.goto("/en/ecu/reports");
    await expect(page).toHaveURL("/en/ECU/reports");
  });

  test("an unknown code is not found", async ({ page }) => {
    await page.goto("/en/XYZ");
    await expect(page.getByText("404 - PAGE NOT FOUND")).toBeVisible({ timeout: 30_000 });
  });

  test("a coming-soon code is not found", async ({ page }) => {
    await page.goto("/en/SUR");
    await expect(page.getByText("404 - PAGE NOT FOUND")).toBeVisible({ timeout: 30_000 });
  });

  test("links to unscoped routes stay unprefixed inside a country", async ({ page }) => {
    await page.goto(`${countryPath("en", "ECU")}/reports`);
    await dismissCookieConsent(page);

    await expect(page.getByRole("link", { name: /sign in|log in/i }).first()).toHaveAttribute(
      "href",
      /^\/en\/auth\/sign-in/,
    );
  });

  test("authentication routes carry no country", async ({ page }) => {
    const selector = new CountrySelector(page);

    await page.goto("/en/auth/sign-in");
    await expect(page).toHaveURL("/en/auth/sign-in");
    await selector.expectNotVisible();
  });
});

// --- Mobile ---

test.describe("country switching on mobile", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("the hamburger menu offers the same choice", async ({ page }) => {
    const selector = new CountrySelector(page);

    await page.goto(`${countryPath()}/reports/grid`);
    await dismissCookieConsent(page);

    await selector.openMobileMenu();
    await expect(selector.mobileLink("ECU")).toBeVisible();

    await selector.mobileLink("ECU").click();
    await expect(page).toHaveURL(/\/en\/ECU\/reports\/grid/);
  });
});
