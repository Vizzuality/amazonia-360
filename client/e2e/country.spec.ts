import { test, expect } from "./fixtures";

// No session needed, so these stay out of country.auth.spec.ts, whose credential skip silenced them.

test.describe("an unknown country module", () => {
  for (const segment of ["SUR", "XYZ"]) {
    test(`/en/${segment} is not found, with the code still in the address bar`, async ({
      page,
    }) => {
      const response = await page.goto(`/en/${segment}/reports`);

      expect(response?.status()).toBe(404);
      expect(new URL(page.url()).pathname).toBe(`/en/${segment}/reports`);
    });
  }
});
