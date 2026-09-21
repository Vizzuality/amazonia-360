import { test, expect } from "./fixtures";

// These run in the signed-out `chromium` project. Every report route is
// gated, so each one must bounce to sign-in with a usable return URL.

const SOME_REPORT_ID = "00000000-0000-0000-0000-000000000000";

// One path per guarded layout: /reports/grid and /reports/indicators share the layout
// that /reports already covers.
const GATED_PATHS = [
  { path: "/en/reports", redirectUrl: "/reports" },
  { path: `/en/reports/${SOME_REPORT_ID}`, redirectUrl: `/reports/${SOME_REPORT_ID}` },
  {
    path: `/en/webshot/reports/${SOME_REPORT_ID}`,
    redirectUrl: `/webshot/reports/${SOME_REPORT_ID}`,
  },
  { path: "/en/private/my-reports", redirectUrl: "/private/my-reports" },
];

test.describe("report tool requires authentication", () => {
  for (const { path, redirectUrl } of GATED_PATHS) {
    test(`${path} redirects a signed-out visitor to sign-in`, async ({ page }) => {
      await page.goto(path);

      await expect(page).toHaveURL(
        `/en/auth/sign-in?redirectUrl=${encodeURIComponent(redirectUrl)}`,
        { timeout: 30_000 },
      );
    });
  }

  test("keeps the query string in the return URL", async ({ page }) => {
    await page.goto("/en/reports/grid?location=test-location");

    await expect(page).toHaveURL(
      `/en/auth/sign-in?redirectUrl=${encodeURIComponent("/reports/grid?location=test-location")}`,
      { timeout: 30_000 },
    );
  });

  test("redirects with a single locale segment in a non-default locale", async ({ page }) => {
    await page.goto("/pt/reports");

    // Guards the double-prefix bug: /pt/pt/auth/... would also "redirect to
    // sign-in" but leaves the user on a 404 after logging in.
    await expect(page).toHaveURL(`/pt/auth/sign-in?redirectUrl=${encodeURIComponent("/reports")}`, {
      timeout: 30_000,
    });
  });
});
