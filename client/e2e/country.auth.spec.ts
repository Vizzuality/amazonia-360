import { test, expect } from "@playwright/test";

import { dismissCookieConsent } from "./helpers/cookie-consent";
import {
  expectActiveModule,
  expectRegionalModule,
  leaveModule,
  leaveModuleInNewTab,
  suppressCountryModuleDialog,
} from "./helpers/country-badge";
import { skipWithoutCredentials } from "./helpers/credentials";
import { expectNodeKept, markNode } from "./helpers/node-identity";

// Entering a module is no longer a control: it happens when the drawn area is mostly inside
// a country, which needs a real ArcGIS sketch. Only leaving can be driven from the DOM.
test.skip(skipWithoutCredentials, "E2E test user credentials not set");

test.beforeEach(async ({ page }) => {
  await suppressCountryModuleDialog(page, "ECU");
});

test.describe("the module in the URL", () => {
  test("the back button returns to the module you came from", async ({ page }) => {
    await page.goto("/en/ECU/reports/grid");
    await dismissCookieConsent(page);
    await expectActiveModule(page, "ECU");

    await leaveModule(page);
    await expect.poll(() => new URL(page.url()).pathname).toBe("/en/reports/grid");
    await expectRegionalModule(page);

    await page.goBack();
    await expect(page).toHaveURL(/\/en\/ECU\/reports\/grid/);
    await expectActiveModule(page, "ECU");
  });

  for (const how of ["modifier", "middle"] as const) {
    test(`a ${how === "middle" ? "middle click" : "cmd/ctrl-click"} leaves the module in a new tab`, async ({
      page,
    }) => {
      await page.goto("/en/ECU/reports/grid");
      await dismissCookieConsent(page);

      const opened = await leaveModuleInNewTab(page, how);

      await expect.poll(() => new URL(opened.url()).pathname).toBe("/en/reports/grid");
      await expect(page).toHaveURL(/\/en\/ECU\/reports\/grid/);
      await expectActiveModule(page, "ECU");
    });
  }
});

test.describe("nothing is rebuilt", () => {
  test("leaving the module on the home page keeps it", async ({ page }) => {
    await page.goto("/en/ECU");
    await expect(page.locator("h2").first()).toBeVisible({ timeout: 30_000 });
    await dismissCookieConsent(page);

    await markNode(page, "main");
    await leaveModule(page);

    await expect.poll(() => new URL(page.url()).pathname).toBe("/en");
    await expectNodeKept(page, "main");
    await expectRegionalModule(page);
  });

  test("leaving the module in the report flow keeps the map", async ({ page }) => {
    await page.goto("/en/ECU/reports");
    await dismissCookieConsent(page);
    await expect(page.locator(".esri-view").first()).toBeVisible({ timeout: 30_000 });

    await markNode(page, ".esri-view");
    await leaveModule(page);

    await expect(page).toHaveURL(/\/en\/reports/);
    await expectNodeKept(page, ".esri-view");
  });

  const HOPS = [
    {
      name: "from the report tool to the grid",
      from: "/reports",
      link: 'a[href$="/reports/grid"], a[href*="/reports/grid?"]',
      to: /\/ECU\/reports\/grid/,
    },
    {
      name: "from the report tool to the indicators hub",
      from: "/reports",
      link: 'main a[href$="/reports/indicators"], main a[href*="/reports/indicators?"]',
      to: /\/ECU\/reports\/indicators/,
    },
    {
      name: "from the grid back to the report tool",
      from: "/reports/grid",
      link: 'main a[href$="/reports"], main a[href*="/reports?"]',
      to: /\/ECU\/reports(\?|$)/,
    },
  ];

  for (const hop of HOPS) {
    test(`moving ${hop.name} inside a module keeps the map`, async ({ page }) => {
      await page.goto(`/en/ECU${hop.from}`);
      await dismissCookieConsent(page);
      await expect(page.locator(".esri-view").first()).toBeVisible({ timeout: 30_000 });

      await markNode(page, ".esri-view");
      await page.locator(hop.link).first().click();

      await expect(page).toHaveURL(hop.to);
      await expectNodeKept(page, ".esri-view");
      await expectActiveModule(page, "ECU");
    });
  }
});
