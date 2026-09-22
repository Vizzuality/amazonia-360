import path from "node:path";
import { fileURLToPath } from "node:url";

import { test, expect } from "@playwright/test";

import { mockArcGISFeatureServer } from "./helpers/arcgis-mock";
import { dismissCookieConsent } from "./helpers/cookie-consent";
import { skipWithoutCredentials } from "./helpers/credentials";
import {
  createReportWithAllTopics,
  drawPoint,
  drawPolyline,
  expectLocationCreated,
  openReportTool,
  setBufferValue,
  uploadAreaFile,
} from "./helpers/reports";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const GEOJSON_FILE = path.resolve(__dirname, "fixtures/files/amazon-polygon.geojson");
const KML_FILE = path.resolve(__dirname, "fixtures/files/amazon-polygon.kml");

test.skip(skipWithoutCredentials, "E2E test user credentials not set");

test.describe("report creation (authenticated)", () => {
  test("draw a point, select topics, and create report as authenticated user", async ({ page }) => {
    await openReportTool(page);
    await dismissCookieConsent(page);

    await drawPoint(page);
    await expectLocationCreated(page);
    await createReportWithAllTopics(page);
  });

  test("draw a polyline, change buffer, select topics, and create report", async ({ page }) => {
    await openReportTool(page);
    await dismissCookieConsent(page);

    await drawPolyline(page);
    await expectLocationCreated(page);

    await expect(page.getByText("Buffer size")).toBeVisible({ timeout: 5_000 });
    await expect(page.getByRole("slider")).toBeVisible();

    await setBufferValue(page, 40);
    await expect(page.getByText("40 km")).toBeVisible({ timeout: 5_000 });

    await createReportWithAllTopics(page);
  });

  test("upload KML file and create report as authenticated user", async ({ page }) => {
    await mockArcGISFeatureServer(page);

    await openReportTool(page);
    await dismissCookieConsent(page);

    await uploadAreaFile(page, KML_FILE);
    await expectLocationCreated(page);
    await createReportWithAllTopics(page);
  });
});

test.describe("report builder (authenticated)", () => {
  test("upload a GeoJSON file", async ({ page }) => {
    await mockArcGISFeatureServer(page);

    await openReportTool(page);
    await dismissCookieConsent(page);

    await uploadAreaFile(page, GEOJSON_FILE);
    await expectLocationCreated(page);
  });
});
