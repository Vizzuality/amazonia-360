import path from "node:path";
import { fileURLToPath } from "node:url";

import { test } from "./fixtures";
import { mockArcGISFeatureServer } from "./helpers/arcgis-mock";
import { dismissCookieConsent } from "./helpers/cookie-consent";
import { ReportPage } from "./pages/report.page";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const hasCredentials = !!(process.env.E2E_TEST_USER_EMAIL && process.env.E2E_TEST_USER_PASSWORD);

const KML_FILE = path.resolve(__dirname, "fixtures/files/amazon-polygon.kml");

// --- Report creation (authenticated) ---

test.describe("report creation (authenticated)", () => {
  test("draw a point, select topics, and create report as authenticated user", async ({
    page,
  }) => {
    test.skip(!hasCredentials, "E2E test user credentials not set");

    const reportPage = new ReportPage(page);
    await reportPage.goto();
    await reportPage.expectLoaded();
    await dismissCookieConsent(page);

    await reportPage.drawPoint();
    await reportPage.expectLocationCreated();
    await reportPage.createReportWithTopics();
  });

  test("draw a polyline, change buffer, select topics, and create report", async ({ page }) => {
    test.skip(!hasCredentials, "E2E test user credentials not set");

    const reportPage = new ReportPage(page);
    await reportPage.goto();
    await reportPage.expectLoaded();
    await dismissCookieConsent(page);

    await reportPage.drawPolyline();
    await reportPage.expectLocationCreated();
    await reportPage.expectBufferVisible();

    await reportPage.setBufferValue(40);
    await reportPage.expectBufferDisplayedValue(40);

    await reportPage.createReportWithTopics();
  });

  test("upload KML file and create report as authenticated user", async ({ page }) => {
    test.skip(!hasCredentials, "E2E test user credentials not set");

    await mockArcGISFeatureServer(page);

    const reportPage = new ReportPage(page);
    await reportPage.goto();
    await reportPage.expectLoaded();
    await dismissCookieConsent(page);

    await reportPage.uploadFile(KML_FILE);
    await reportPage.expectLocationCreated();
    await reportPage.createReportWithTopics();
  });
});
