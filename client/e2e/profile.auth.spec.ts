import { test, expect } from "@playwright/test";

import { dismissCookieConsent } from "./helpers/cookie-consent";
import { skipWithoutCredentials } from "./helpers/credentials";

// The authenticated project needs the seeded test user this test toggles and restores.
test.skip(skipWithoutCredentials, "E2E test user credentials not set");

test("countries of interest survive a reload", async ({ page }) => {
  await page.goto("/en/private/profile");
  await dismissCookieConsent(page);

  const chip = page.getByRole("button", { name: "Peru" });
  await expect(chip).toBeVisible({ timeout: 15_000 });
  const startPressed = await chip.getAttribute("aria-pressed");

  const savePreferences = () => {
    const saved = page.waitForResponse(
      (response) =>
        response.request().method() === "PATCH" &&
        response.url().includes("/users") &&
        response.ok(),
    );
    return page
      .getByRole("button", { name: "Update preferences" })
      .click()
      .then(() => saved);
  };

  let toggled = false;

  try {
    await chip.click();
    toggled = true;
    await savePreferences();

    await page.reload();
    const reloadedChip = page.getByRole("button", { name: "Peru" });
    await expect(reloadedChip).toBeVisible({ timeout: 15_000 });
    await expect(reloadedChip).not.toHaveAttribute("aria-pressed", startPressed ?? "false");
  } finally {
    if (toggled) {
      await page.getByRole("button", { name: "Peru" }).click();
      await savePreferences();
    }
  }
});
