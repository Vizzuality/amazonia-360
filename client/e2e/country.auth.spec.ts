import { test, expect } from "@playwright/test";

import { dismissCookieConsent } from "./helpers/cookie-consent";
import { skipWithoutCredentials } from "./helpers/credentials";
import {
  AMAZON_REGION,
  ECUADOR,
  expectActiveModule,
  switchModule,
  switchModuleInNewTab,
} from "./helpers/module-selector";
import { expectNodeKept, markNode } from "./helpers/node-identity";
import { openReportTool } from "./helpers/reports";

// The picker lives in the header of the report tool, which is gated, so these run
// in the signed-in `chromium-authenticated` project.
test.skip(skipWithoutCredentials, "E2E test user credentials not set");

test.describe("the module in the URL", () => {
  test("the back button returns to the module you came from", async ({ page }) => {
    await page.goto("/en/reports/grid");
    await dismissCookieConsent(page);

    await switchModule(page, ECUADOR);
    await expect(page).toHaveURL(/\/en\/ECU\/reports\/grid/);

    await page.goBack();
    await expect.poll(() => new URL(page.url()).pathname).toBe("/en/reports/grid");
    await expectActiveModule(page, AMAZON_REGION);
  });

  for (const how of ["modifier", "middle"] as const) {
    test(`a ${how === "middle" ? "middle click" : "cmd/ctrl-click"} opens the module in a new tab`, async ({
      page,
    }) => {
      await page.goto("/en/reports/grid");
      await dismissCookieConsent(page);

      const opened = await switchModuleInNewTab(page, ECUADOR, how);

      await expect(opened).toHaveURL(/\/en\/ECU\/reports\/grid/);
      await expect.poll(() => new URL(page.url()).pathname).toBe("/en/reports/grid");
      await expectActiveModule(page, AMAZON_REGION);
    });
  }
});

test.describe("nothing is rebuilt", () => {
  test("switching module on the home page keeps it", async ({ page }) => {
    await page.goto("/en");
    await expect(page.locator("h2").first()).toBeVisible({ timeout: 30_000 });
    await dismissCookieConsent(page);

    await markNode(page, "main");
    await switchModule(page, ECUADOR);

    await expect.poll(() => new URL(page.url()).pathname).toBe("/en/ECU");
    await expectNodeKept(page, "main");
    await expectActiveModule(page, ECUADOR);
  });

  test("switching module in the report flow keeps the map", async ({ page }) => {
    await openReportTool(page);
    await dismissCookieConsent(page);

    await markNode(page, ".esri-view");
    await switchModule(page, ECUADOR);

    await expect(page).toHaveURL(/\/en\/ECU\/reports/);
    await expectNodeKept(page, ".esri-view");
  });

  const HOPS = [
    {
      name: "from the report tool to the grid",
      from: "/reports",
      link: 'a[href$="/reports/grid"], a[href*="/reports/grid?"]',
      to: /\/reports\/grid/,
      switchFirst: false,
    },
    {
      name: "from the report tool to the indicators hub",
      from: "/reports",
      link: 'main a[href$="/reports/indicators"], main a[href*="/reports/indicators?"]',
      to: /\/reports\/indicators/,
      switchFirst: true,
    },
    {
      name: "from the grid back to the report tool",
      from: "/reports/grid",
      link: 'main a[href$="/reports"], main a[href*="/reports?"]',
      to: /\/reports(\?|$)/,
      switchFirst: false,
    },
  ];

  for (const hop of HOPS) {
    const suffix = hop.switchFirst ? ", after switching module" : "";

    test(`moving ${hop.name} keeps the map${suffix}`, async ({ page }) => {
      await page.goto(`/en${hop.from}`);
      await dismissCookieConsent(page);
      await expect(page.locator(".esri-view").first()).toBeVisible({ timeout: 30_000 });

      if (hop.switchFirst) {
        await switchModule(page, ECUADOR);
        await expect.poll(() => new URL(page.url()).pathname).toContain("/ECU/");
      }

      await markNode(page, ".esri-view");
      await page.locator(hop.link).first().click();

      await expect(page).toHaveURL(hop.to);
      await expectNodeKept(page, ".esri-view");
      await expectActiveModule(page, hop.switchFirst ? ECUADOR : AMAZON_REGION);
    });
  }
});
