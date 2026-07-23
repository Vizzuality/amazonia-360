import { test, expect } from "./fixtures";
import { dismissCookieConsent } from "./helpers/cookie-consent";
import { ReportsIdPage } from "./pages/reports-id.page";

const hasCredentials = !!(process.env.E2E_TEST_USER_EMAIL && process.env.E2E_TEST_USER_PASSWORD);
const seedSecret = process.env.E2E_SEED_SECRET;

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

// ---------------------------------------------------------------------------
// Helper: seed a report via the server endpoint
// ---------------------------------------------------------------------------

async function seedReport(
  request: import("@playwright/test").APIRequestContext,
  options: {
    title?: string;
    userEmail?: string;
    status?: "draft" | "published";
  } = {},
): Promise<string> {
  if (!seedSecret) throw new Error("E2E_SEED_SECRET not set");

  const response = await request.post("/local-api/e2e/seed-report", {
    data: {
      secret: seedSecret,
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

// --- Owner tests ---

test.describe("report view (authenticated owner)", () => {
  test("owner sees Save button, not Make a copy", async ({ page, request }) => {
    test.skip(!hasCredentials, "E2E test user credentials not set");
    test.skip(!seedSecret, "E2E_SEED_SECRET not set");

    const reportId = await seedReport(request, {
      title: "Owner Report",
      userEmail: process.env.E2E_TEST_USER_EMAIL,
    });

    const reportsIdPage = new ReportsIdPage(page);
    await reportsIdPage.goto(reportId);
    await dismissCookieConsent(page);
    await reportsIdPage.expectLoaded();

    await reportsIdPage.expectTitle("Owner Report");
    await reportsIdPage.expectSaveButtonVisible();
    await reportsIdPage.expectMakeACopyButtonNotVisible();
  });

  test("owner can edit title and confirm", async ({ page, request }) => {
    test.skip(!hasCredentials, "E2E test user credentials not set");
    test.skip(!seedSecret, "E2E_SEED_SECRET not set");

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

  test("owner can cancel title edit and preserve original title", async ({ page, request }) => {
    test.skip(!hasCredentials, "E2E test user credentials not set");
    test.skip(!seedSecret, "E2E_SEED_SECRET not set");

    const reportId = await seedReport(request, {
      title: "Keep This Title",
      userEmail: process.env.E2E_TEST_USER_EMAIL,
    });

    const reportsIdPage = new ReportsIdPage(page);
    await reportsIdPage.goto(reportId);
    await dismissCookieConsent(page);
    await reportsIdPage.expectLoaded();
    await reportsIdPage.expectTitle("Keep This Title");

    await reportsIdPage.startTitleEdit();
    await reportsIdPage.typeTitleValue("Should Not Stick");
    await reportsIdPage.cancelTitleEdit();

    await reportsIdPage.expectTitle("Keep This Title");
  });

  test("Edit Report button toggles sidebar", async ({ page, request }) => {
    test.skip(!hasCredentials, "E2E test user credentials not set");
    test.skip(!seedSecret, "E2E_SEED_SECRET not set");

    const reportId = await seedReport(request, {
      userEmail: process.env.E2E_TEST_USER_EMAIL,
    });

    const reportsIdPage = new ReportsIdPage(page);
    await reportsIdPage.goto(reportId);
    await dismissCookieConsent(page);
    await reportsIdPage.expectLoaded();

    // Click "Edit report" to open sidebar
    await reportsIdPage.expectEditReportButtonVisible();
    await reportsIdPage.clickEditReport();
    await reportsIdPage.expectCloseEditingButtonVisible();

    // Click "Close editing" to close sidebar
    await page.getByRole("button", { name: "Close editing" }).click();
    await reportsIdPage.expectEditReportButtonVisible();
  });

  test("share action opens share dialog directly when no unsaved changes", async ({
    page,
    request,
  }) => {
    test.skip(!hasCredentials, "E2E test user credentials not set");
    test.skip(!seedSecret, "E2E_SEED_SECRET not set");

    const reportId = await seedReport(request, {
      userEmail: process.env.E2E_TEST_USER_EMAIL,
    });

    const reportsIdPage = new ReportsIdPage(page);
    await reportsIdPage.goto(reportId);
    await dismissCookieConsent(page);
    await reportsIdPage.expectLoaded();

    await reportsIdPage.openActionsMenu();
    await reportsIdPage.clickShareAction();
    await reportsIdPage.expectShareDialogWithUrl(reportId);
  });

  test("duplicate action changes URL to new report", async ({ page, request }) => {
    test.skip(!hasCredentials, "E2E test user credentials not set");
    test.skip(!seedSecret, "E2E_SEED_SECRET not set");

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

// --- Non-owner tests ---

test.describe("report view (authenticated non-owner)", () => {
  test("non-owner sees Make a copy, not Save", async ({ page, request }) => {
    test.skip(!hasCredentials, "E2E test user credentials not set");
    test.skip(!seedSecret, "E2E_SEED_SECRET not set");

    // Seed report without userEmail so it has no owner
    const reportId = await seedReport(request, {
      title: "Someone Else Report",
    });

    const reportsIdPage = new ReportsIdPage(page);
    await reportsIdPage.goto(reportId);
    await dismissCookieConsent(page);
    await reportsIdPage.expectLoaded();

    await reportsIdPage.expectTitle("Someone Else Report");
    await reportsIdPage.expectMakeACopyButtonVisible();
    await reportsIdPage.expectSaveButtonNotVisible();
  });

  test("non-owner can see report title", async ({ page, request }) => {
    test.skip(!hasCredentials, "E2E test user credentials not set");
    test.skip(!seedSecret, "E2E_SEED_SECRET not set");

    const reportId = await seedReport(request, {
      title: "Read Only Report",
    });

    const reportsIdPage = new ReportsIdPage(page);
    await reportsIdPage.goto(reportId);
    await dismissCookieConsent(page);
    await reportsIdPage.expectLoaded();

    await reportsIdPage.expectTitle("Read Only Report");
  });

  test("non-owner can access actions menu", async ({ page, request }) => {
    test.skip(!hasCredentials, "E2E test user credentials not set");
    test.skip(!seedSecret, "E2E_SEED_SECRET not set");

    const reportId = await seedReport(request);

    const reportsIdPage = new ReportsIdPage(page);
    await reportsIdPage.goto(reportId);
    await dismissCookieConsent(page);
    await reportsIdPage.expectLoaded();

    await reportsIdPage.openActionsMenu();
    await reportsIdPage.expectActionsMenuItems();
  });
});
