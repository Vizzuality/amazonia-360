import { test, expect } from "./fixtures";
import { dismissCookieConsent } from "./helpers/cookie-consent";
import { ReportsIdPage } from "./pages/reports-id.page";
import { ReportsPage } from "./pages/reports.page";

// ---------------------------------------------------------------------------
// Helper: create a report via the UI flow and return the report ID
// ---------------------------------------------------------------------------

async function createReportViaUI(page: import("@playwright/test").Page): Promise<string> {
  const reportsPage = new ReportsPage(page);
  await reportsPage.goto();
  await reportsPage.expectLoaded();
  await dismissCookieConsent(page);

  await reportsPage.drawPoint();
  await reportsPage.expectLocationCreated();
  await reportsPage.createReportWithTopics();

  // Extract the report ID from the URL: /en/reports/{id}
  const url = page.url();
  const match = url.match(/\/reports\/([\w-]+)/);
  if (!match) throw new Error(`Could not extract report ID from URL: ${url}`);
  return match[1];
}

// --- Report view page (anonymous) ---

test.describe("report view page (anonymous)", () => {
  test("anonymous user creates report and views it with correct elements", async ({ page }) => {
    const reportId = await createReportViaUI(page);
    const reportsIdPage = new ReportsIdPage(page);

    // Page should already be on the report view URL after creation
    await reportsIdPage.expectLoaded();

    // Anonymous reports are drafts, so the disclaimer should be visible
    await reportsIdPage.expectDraftDisclaimerVisible();

    // Anonymous creator IS the owner (via anonymous-users session), so sees "Save"
    await reportsIdPage.expectSaveButtonVisible();
    await reportsIdPage.expectMakeACopyButtonNotVisible();
  });

  test("actions menu shows all expected items", async ({ page }) => {
    const reportId = await createReportViaUI(page);
    const reportsIdPage = new ReportsIdPage(page);

    await reportsIdPage.expectLoaded();
    await reportsIdPage.openActionsMenu();
    await reportsIdPage.expectActionsMenuItems();
  });

  test("share dialog shows correct URL with report ID", async ({ page }) => {
    const reportId = await createReportViaUI(page);
    const reportsIdPage = new ReportsIdPage(page);

    await reportsIdPage.expectLoaded();
    await reportsIdPage.openActionsMenu();
    await reportsIdPage.clickShareAction();
    await reportsIdPage.expectShareDialogWithUrl(reportId);
  });

  test("knowledge resources section is visible", async ({ page }) => {
    const reportId = await createReportViaUI(page);
    const reportsIdPage = new ReportsIdPage(page);

    await reportsIdPage.expectLoaded();
    await reportsIdPage.expectKnowledgeResourcesVisible();
  });

  test("not-found page for invalid report ID", async ({ page }) => {
    await dismissCookieConsent(page).catch(() => {});
    const reportsIdPage = new ReportsIdPage(page);

    await reportsIdPage.goto("nonexistent-report-id-12345");
    await reportsIdPage.expectNotFound();
  });
});
