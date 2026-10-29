import { type Page, test, expect } from "@playwright/test";

import { defaultTopicsConfigParser } from "../src/lib/url-state/parsers";

import { dismissCookieConsent } from "./helpers/cookie-consent";
import { skipWithoutSeedSecret } from "./helpers/credentials";
import { seedOwnReport } from "./helpers/seed";

test.skip(skipWithoutSeedSecret, "E2E_SEED_SECRET not set");

const SHARED_BBOX = [-8_000_000, -1_500_000, -6_000_000, 500_000];
const OVERVIEW_MAP_INDICATOR = 5;

function getBbox(page: Page): number[] | null {
  const bbox = new URL(page.url()).searchParams.get("bbox");
  return bbox ? bbox.split(",").map(Number) : null;
}

function getCenter([xmin, ymin, xmax, ymax]: number[]) {
  return { x: (xmin + xmax) / 2, y: (ymin + ymax) / 2 };
}

test("a shared bbox opens the map on the same area", async ({ page }) => {
  await page.goto(`/en/reports?bbox=${SHARED_BBOX.join(",")}`);
  await dismissCookieConsent(page);
  await expect(page.locator(".esri-view").first()).toBeVisible({ timeout: 30_000 });

  // Zooming in keeps the centre, and the map writes its new extent back to the URL.
  await page.getByRole("button", { name: "Zoom in" }).click();
  await expect
    .poll(() => getBbox(page)?.join(","), { timeout: 30_000 })
    .not.toBe(SHARED_BBOX.join(","));

  const zoomed = getBbox(page);
  expect(zoomed).toHaveLength(4);
  const tolerance = (SHARED_BBOX[2] - SHARED_BBOX[0]) * 0.05;
  const { x, y } = getCenter(zoomed!);
  expect(Math.abs(x - getCenter(SHARED_BBOX).x)).toBeLessThan(tolerance);
  expect(Math.abs(y - getCenter(SHARED_BBOX).y)).toBeLessThan(tolerance);
});

test("shared defaultTopics survive opening the report", async ({ page }) => {
  const reportId = await seedOwnReport(page.request, "Shared overview");
  const defaultTopics = defaultTopicsConfigParser.defaultValue.map((topic) => ({
    ...topic,
    indicators: topic.indicators?.map((indicator) =>
      indicator.indicator_id === OVERVIEW_MAP_INDICATOR
        ? { ...indicator, opacity: 0.4 }
        : indicator,
    ),
  }));
  const query = defaultTopicsConfigParser.serialize(defaultTopics);

  await page.goto(`/en/reports/${reportId}?defaultTopics=${encodeURIComponent(query)}`);
  await dismissCookieConsent(page);

  const overviewMap = page
    .locator(".react-grid-item")
    .filter({ has: page.getByRole("heading", { name: "Administrative Capitals", level: 2 }) })
    .filter({ has: page.getByRole("application") });
  await overviewMap.scrollIntoViewIfNeeded({ timeout: 30_000 });
  await expect(overviewMap.locator(".esri-view")).toBeVisible({ timeout: 30_000 });

  const kept = new URL(page.url()).searchParams.get("defaultTopics");
  expect(kept).toBe(query);
  expect(defaultTopicsConfigParser.parse(kept!)).toEqual(defaultTopics);
});
