import { test, expect } from "@playwright/test";

import { dismissCookieConsent } from "./helpers/cookie-consent";
import { skipWithoutCredentials, skipWithoutSeedSecret } from "./helpers/credentials";

test.skip(skipWithoutCredentials, "E2E test user credentials not set");

const SAMPLE_LOCATION = {
  type: "point" as const,
  geometry: {
    x: -7013128,
    y: -334111,
    spatialReference: { wkid: 102100 },
  },
  buffer: 60,
};

const SAMPLE_TOPICS = [
  {
    topic_id: 1,
    indicators: [
      {
        indicator_id: 1,
        type: "numeric",
        x: 0,
        y: 0,
        w: 2,
        h: 1,
      },
    ],
  },
];

async function seedReport(
  request: import("@playwright/test").APIRequestContext,
  options: {
    title?: string;
    userEmail?: string;
    status?: "draft" | "published";
  } = {},
): Promise<string> {
  const secret = process.env.E2E_SEED_SECRET;
  if (!secret) throw new Error("E2E_SEED_SECRET not set");

  const response = await request.post("/local-api/e2e/seed-report", {
    data: {
      secret,
      title: options.title ?? "E2E Test Report",
      location: SAMPLE_LOCATION,
      topics: SAMPLE_TOPICS,
      status: options.status ?? "published",
      ...(options.userEmail && { userEmail: options.userEmail }),
    },
  });

  if (!response.ok()) {
    const body = await response.text();
    throw new Error(`Seed report failed (${response.status()}): ${body}`);
  }

  const result = await response.json();
  return result.id;
}

async function openReport(page: import("@playwright/test").Page, reportId: string) {
  await page.goto(`/en/reports/${reportId}`);
  await dismissCookieConsent(page);

  await expect(page.locator("h2").first()).toBeVisible({ timeout: 30_000 });
}

test.describe("report view (authenticated owner)", () => {
  test.skip(skipWithoutSeedSecret, "E2E_SEED_SECRET not set");

  test("an owner's title edit survives a reload", async ({ page, request }) => {
    const reportId = await seedReport(request, {
      title: "Original Title",
      userEmail: process.env.E2E_TEST_USER_EMAIL,
    });

    await openReport(page, reportId);
    await expect(page.getByRole("heading", { name: "Original Title", level: 2 })).toBeVisible({
      timeout: 10_000,
    });

    await page.getByRole("button", { name: "Edit", exact: true }).click();

    const titleInput = page.locator("#title");
    await expect(titleInput).toBeVisible({ timeout: 5_000 });
    await titleInput.clear();
    await titleInput.fill("Updated Title");
    await page.locator('form#report-title button[type="submit"]').click();

    await expect(page.getByRole("heading", { name: "Updated Title", level: 2 })).toBeVisible({
      timeout: 10_000,
    });

    // Wait for the PATCH, so the reload below proves persistence instead of racing it.
    const saved = page.waitForResponse(
      (response) =>
        response.request().method() === "PATCH" &&
        response.url().includes("/reports") &&
        response.ok(),
    );
    await page.getByRole("button", { name: "Save", exact: true }).click();
    await saved;

    await page.reload();
    await expect(page.locator("h2").first()).toBeVisible({ timeout: 30_000 });
    await expect(page.getByRole("heading", { name: "Updated Title", level: 2 })).toBeVisible({
      timeout: 10_000,
    });
  });

  test("duplicate action changes URL to new report", async ({ page, request }) => {
    const reportId = await seedReport(request, {
      userEmail: process.env.E2E_TEST_USER_EMAIL,
    });

    await openReport(page, reportId);

    const originalUrl = page.url();

    await page.getByRole("button", { name: "Open menu" }).click();
    await page.getByRole("menuitem", { name: "Duplicate" }).click();

    await expect(page).toHaveURL(/\/reports\/[\w-]+/, { timeout: 30_000 });
    await expect(page).not.toHaveURL(originalUrl);
  });
});
