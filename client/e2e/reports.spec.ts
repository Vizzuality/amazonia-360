import { test, expect } from "./fixtures";

// These run in the signed-out `chromium` project. Every report route is
// gated, so each one must bounce to sign-in with a usable return URL.

const GATED_PATHS = [
  { path: "/en/reports", redirectUrl: "/reports" },
  { path: "/en/reports/grid", redirectUrl: "/reports/grid" },
  { path: "/en/reports/indicators", redirectUrl: "/reports/indicators" },
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
    await expect(page).toHaveURL(
      `/pt/auth/sign-in?redirectUrl=${encodeURIComponent("/reports")}`,
      { timeout: 30_000 },
    );
  });
});
