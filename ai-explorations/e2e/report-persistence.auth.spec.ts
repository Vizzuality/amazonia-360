import path from "node:path";
import { fileURLToPath } from "node:url";

import { test, expect } from "@playwright/test";

import { mockArcGISFeatureServer } from "./helpers/arcgis-mock";
import { dismissCookieConsent } from "./helpers/cookie-consent";
import { skipWithoutSeedSecret } from "./helpers/credentials";
import {
  createReportWithAllTopics,
  expectLocationCreated,
  openReportTool,
  uploadAreaFile,
} from "./helpers/reports";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const KML_FILE = path.resolve(__dirname, "fixtures/files/amazon-polygon.kml");

test.skip(skipWithoutSeedSecret, "E2E_SEED_SECRET not set");

test("a created report is stored and opens again after a reload", async ({ page }) => {
  await mockArcGISFeatureServer(page);
  await openReportTool(page);
  await dismissCookieConsent(page);

  await uploadAreaFile(page, KML_FILE);
  await expectLocationCreated(page);
  // The mock answers every FeatureServer query, the report's own layers included.
  await page.unrouteAll();
  await createReportWithAllTopics(page);

  const reportId = new URL(page.url()).pathname.split("/").at(-1);
  const stored = await page.request.get(`/v1/api/reports/${reportId}?depth=0`);
  expect(stored.ok()).toBe(true);
  const report = (await stored.json()) as {
    location: { type: string };
    topics: unknown[];
  };
  expect(report.location.type).toBe("polygon");
  expect(report.topics.length).toBeGreaterThan(0);

  const editTitle = page.getByRole("button", { name: "Edit", exact: true });
  await expect(editTitle).toBeVisible({ timeout: 30_000 });
  const title = await page.getByRole("heading", { level: 2 }).first().textContent();

  await page.reload();
  await expect.poll(() => new URL(page.url()).pathname).toBe(`/en/reports/${reportId}`);
  await expect(editTitle).toBeVisible({ timeout: 30_000 });
  expect(title?.trim()).toBeTruthy();
  await expect(page.getByRole("heading", { level: 2 }).first()).toHaveText(title!);
});
