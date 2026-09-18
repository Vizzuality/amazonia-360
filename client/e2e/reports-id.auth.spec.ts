import { test, expect } from "./fixtures";
import { dismissCookieConsent } from "./helpers/cookie-consent";
import { skipWithoutCredentials, skipWithoutSeedSecret } from "./helpers/credentials";
import { ReportsIdPage } from "./pages/reports-id.page";

test.skip(skipWithoutCredentials, "E2E test user credentials not set");

/** Sample location matching the point geometry used in report creation tests. */
const SAMPLE_LOCATION = {
  type: "point" as const,
  geometry: {
    x: -7013128,
    y: -334111,
    spatialReference: { wkid: 102100 },
  },
  buffer: 60,
};

/** Minimal topics array for seeded reports. */
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

test.describe("report view (authenticated owner)", () => {
  test.skip(skipWithoutSeedSecret, "E2E_SEED_SECRET not set");

  test("owner can edit title and confirm", async ({ page, request }) => {
    const reportId = await seedReport(request, {
      title: "Original Title",
      userEmail: process.env.E2E_TEST_USER_EMAIL,
    });

    const reportsIdPage = new ReportsIdPage(page);
    await reportsIdPage.goto(reportId);
    await dismissCookieConsent(page);
    await reportsIdPage.expectLoaded();
    await reportsIdPage.expectTitle("Original Title");

    await reportsIdPage.startTitleEdit();
    await reportsIdPage.typeTitleValue("Updated Title");
    await reportsIdPage.confirmTitleEdit();

    await reportsIdPage.expectTitle("Updated Title");
  });

  test("duplicate action changes URL to new report", async ({ page, request }) => {
    const reportId = await seedReport(request, {
      userEmail: process.env.E2E_TEST_USER_EMAIL,
    });

    const reportsIdPage = new ReportsIdPage(page);
    await reportsIdPage.goto(reportId);
    await dismissCookieConsent(page);
    await reportsIdPage.expectLoaded();

    const originalUrl = page.url();

    await reportsIdPage.openActionsMenu();
    await reportsIdPage.clickDuplicateAction();

    // URL should change to a different report ID
    await expect(page).toHaveURL(/\/reports\/[\w-]+/, { timeout: 30_000 });
    await expect(page).not.toHaveURL(originalUrl);
  });
});
