import path from "node:path";
import { fileURLToPath } from "node:url";

import { test } from "./fixtures";
import { mockArcGISFeatureServer } from "./helpers/arcgis-mock";
import { dismissCookieConsent } from "./helpers/cookie-consent";
import { ReportsPage } from "./pages/reports.page";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const GEOJSON_FILE = path.resolve(__dirname, "fixtures/files/amazon-polygon.geojson");
const KML_FILE = path.resolve(__dirname, "fixtures/files/amazon-polygon.kml");

// --- Page rendering ---

test.describe("report creation page", () => {
  test("loads the reports page with drawing tools", async ({ page }) => {
    const reportsPage = new ReportsPage(page);
    await reportsPage.goto();
    await reportsPage.expectLoaded();
  });
});

// --- Drawing tools ---

test.describe("drawing tools", () => {
  test("draw a point and change the buffer", async ({ page }) => {
    const reportsPage = new ReportsPage(page);
    await reportsPage.goto();
    await reportsPage.expectLoaded();
    await dismissCookieConsent(page);

    await reportsPage.drawPoint();
    await reportsPage.expectLocationCreated();
    await reportsPage.expectBufferVisible();

    await reportsPage.setBufferValue(50);
    await reportsPage.expectBufferDisplayedValue(50);
  });

  test("draw a polyline and change the buffer", async ({ page }) => {
    const reportsPage = new ReportsPage(page);
    await reportsPage.goto();
    await reportsPage.expectLoaded();
    await dismissCookieConsent(page);

    await reportsPage.drawPolyline();
    await reportsPage.expectLocationCreated();
    await reportsPage.expectBufferVisible();

    await reportsPage.setBufferValue(75);
    await reportsPage.expectBufferDisplayedValue(75);
  });

  test("draw a polygon (no buffer control)", async ({ page }) => {
    const reportsPage = new ReportsPage(page);
    await reportsPage.goto();
    await reportsPage.expectLoaded();
    await dismissCookieConsent(page);

    await reportsPage.drawPolygon();
    await reportsPage.expectLocationCreated();
    await reportsPage.expectBufferNotVisible();
  });
});

// --- File upload ---

test.describe("file upload", () => {
  test("upload a GeoJSON file", async ({ page }) => {
    await mockArcGISFeatureServer(page);

    const reportsPage = new ReportsPage(page);
    await reportsPage.goto();
    await reportsPage.expectLoaded();
    await dismissCookieConsent(page);

    await reportsPage.uploadFile(GEOJSON_FILE);
    await reportsPage.expectLocationCreated();
  });

  test("upload a KML file", async ({ page }) => {
    await mockArcGISFeatureServer(page);

    const reportsPage = new ReportsPage(page);
    await reportsPage.goto();
    await reportsPage.expectLoaded();
    await dismissCookieConsent(page);

    await reportsPage.uploadFile(KML_FILE);
    await reportsPage.expectLocationCreated();
  });
});

// --- Report creation (anonymous) ---

test.describe("report creation (anonymous)", () => {
  test("draw a point, select topics, and create report", async ({ page }) => {
    const reportsPage = new ReportsPage(page);
    await reportsPage.goto();
    await reportsPage.expectLoaded();
    await dismissCookieConsent(page);

    await reportsPage.drawPoint();
    await reportsPage.expectLocationCreated();
    await reportsPage.createReportWithTopics();
  });

  test("draw a polygon, select topics, and create report", async ({ page }) => {
    const reportsPage = new ReportsPage(page);
    await reportsPage.goto();
    await reportsPage.expectLoaded();
    await dismissCookieConsent(page);

    await reportsPage.drawPolygon();
    await reportsPage.expectLocationCreated();
    await reportsPage.createReportWithTopics();
  });

  test("upload GeoJSON, select topics, and create report", async ({ page }) => {
    await mockArcGISFeatureServer(page);

    const reportsPage = new ReportsPage(page);
    await reportsPage.goto();
    await reportsPage.expectLoaded();
    await dismissCookieConsent(page);

    await reportsPage.uploadFile(GEOJSON_FILE);
    await reportsPage.expectLocationCreated();
    await reportsPage.createReportWithTopics();
  });
});
