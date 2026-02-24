import path from "node:path";
import { fileURLToPath } from "node:url";

import { test } from "./fixtures";
import { mockArcGISFeatureServer } from "./helpers/arcgis-mock";
import { dismissCookieConsent } from "./helpers/cookie-consent";
import { ReportPage } from "./pages/report.page";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const GEOJSON_FILE = path.resolve(__dirname, "fixtures/files/amazon-polygon.geojson");
const KML_FILE = path.resolve(__dirname, "fixtures/files/amazon-polygon.kml");

// --- Page rendering ---

test.describe("report creation page", () => {
  test("loads the reports page with drawing tools", async ({ page }) => {
    const reportPage = new ReportPage(page);
    await reportPage.goto();
    await reportPage.expectLoaded();
  });
});

// --- Drawing tools ---

test.describe("drawing tools", () => {
  test("draw a point and change the buffer", async ({ page }) => {
    const reportPage = new ReportPage(page);
    await reportPage.goto();
    await reportPage.expectLoaded();
    await dismissCookieConsent(page);

    await reportPage.drawPoint();
    await reportPage.expectLocationCreated();
    await reportPage.expectBufferVisible();

    await reportPage.setBufferValue(50);
    await reportPage.expectBufferDisplayedValue(50);
  });

  test("draw a polyline and change the buffer", async ({ page }) => {
    const reportPage = new ReportPage(page);
    await reportPage.goto();
    await reportPage.expectLoaded();
    await dismissCookieConsent(page);

    await reportPage.drawPolyline();
    await reportPage.expectLocationCreated();
    await reportPage.expectBufferVisible();

    await reportPage.setBufferValue(75);
    await reportPage.expectBufferDisplayedValue(75);
  });

  test("draw a polygon (no buffer control)", async ({ page }) => {
    const reportPage = new ReportPage(page);
    await reportPage.goto();
    await reportPage.expectLoaded();
    await dismissCookieConsent(page);

    await reportPage.drawPolygon();
    await reportPage.expectLocationCreated();
    await reportPage.expectBufferNotVisible();
  });
});

// --- File upload ---

test.describe("file upload", () => {
  test("upload a GeoJSON file", async ({ page }) => {
    await mockArcGISFeatureServer(page);

    const reportPage = new ReportPage(page);
    await reportPage.goto();
    await reportPage.expectLoaded();
    await dismissCookieConsent(page);

    await reportPage.uploadFile(GEOJSON_FILE);
    await reportPage.expectLocationCreated();
  });

  test("upload a KML file", async ({ page }) => {
    await mockArcGISFeatureServer(page);

    const reportPage = new ReportPage(page);
    await reportPage.goto();
    await reportPage.expectLoaded();
    await dismissCookieConsent(page);

    await reportPage.uploadFile(KML_FILE);
    await reportPage.expectLocationCreated();
  });
});

// --- Report creation (anonymous) ---

test.describe("report creation (anonymous)", () => {
  test("draw a point, select topics, and create report", async ({ page }) => {
    const reportPage = new ReportPage(page);
    await reportPage.goto();
    await reportPage.expectLoaded();
    await dismissCookieConsent(page);

    await reportPage.drawPoint();
    await reportPage.expectLocationCreated();
    await reportPage.createReportWithTopics();
  });

  test("draw a polygon, select topics, and create report", async ({ page }) => {
    const reportPage = new ReportPage(page);
    await reportPage.goto();
    await reportPage.expectLoaded();
    await dismissCookieConsent(page);

    await reportPage.drawPolygon();
    await reportPage.expectLocationCreated();
    await reportPage.createReportWithTopics();
  });

  test("upload GeoJSON, select topics, and create report", async ({ page }) => {
    await mockArcGISFeatureServer(page);

    const reportPage = new ReportPage(page);
    await reportPage.goto();
    await reportPage.expectLoaded();
    await dismissCookieConsent(page);

    await reportPage.uploadFile(GEOJSON_FILE);
    await reportPage.expectLocationCreated();
    await reportPage.createReportWithTopics();
  });
});
