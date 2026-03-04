import path from "node:path";
import { fileURLToPath } from "node:url";

import { test } from "./fixtures";
import { mockArcGISFeatureServer } from "./helpers/arcgis-mock";
import { dismissCookieConsent } from "./helpers/cookie-consent";
import { ReportsPage } from "./pages/reports.page";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const hasCredentials = !!(process.env.E2E_TEST_USER_EMAIL && process.env.E2E_TEST_USER_PASSWORD);

const KML_FILE = path.resolve(__dirname, "fixtures/files/amazon-polygon.kml");

// --- Report creation (authenticated) ---

test.describe("report creation (authenticated)", () => {
  test("draw a point, select topics, and create report as authenticated user", async ({
    page,
  }) => {
    test.skip(!hasCredentials, "E2E test user credentials not set");

    const reportsPage = new ReportsPage(page);
    await reportsPage.goto();
    await reportsPage.expectLoaded();
    await dismissCookieConsent(page);

    await reportsPage.drawPoint();
    await reportsPage.expectLocationCreated();
    await reportsPage.createReportWithTopics();
  });

  test("draw a polyline, change buffer, select topics, and create report", async ({ page }) => {
    test.skip(!hasCredentials, "E2E test user credentials not set");

    const reportsPage = new ReportsPage(page);
    await reportsPage.goto();
    await reportsPage.expectLoaded();
    await dismissCookieConsent(page);

    await reportsPage.drawPolyline();
    await reportsPage.expectLocationCreated();
    await reportsPage.expectBufferVisible();

    await reportsPage.setBufferValue(40);
    await reportsPage.expectBufferDisplayedValue(40);

    await reportsPage.createReportWithTopics();
  });

  test("upload KML file and create report as authenticated user", async ({ page }) => {
    test.skip(!hasCredentials, "E2E test user credentials not set");

    await mockArcGISFeatureServer(page);

    const reportsPage = new ReportsPage(page);
    await reportsPage.goto();
    await reportsPage.expectLoaded();
    await dismissCookieConsent(page);

    await reportsPage.uploadFile(KML_FILE);
    await reportsPage.expectLocationCreated();
    await reportsPage.createReportWithTopics();
  });
});
