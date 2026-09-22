import fs from "node:fs";
import path from "node:path";

import { type Page, expect } from "@playwright/test";

const GEOMETRIES = {
  point: {
    x: -7013128,
    y: -334111,
    spatialReference: { wkid: 102100 },
  },
  polyline: {
    paths: [
      [
        [-7180000, -446000],
        [-6958000, -222000],
        [-6847000, -501000],
      ],
    ],
    spatialReference: { wkid: 102100 },
  },
} as const;

/** Mirrors `BUFFERS` in constants/map.ts — the app applies these on the first draw. */
const DEFAULT_BUFFERS = { point: 60, polyline: 30 } as const;

const MIME_OVERRIDES: Record<string, string> = {
  ".geojson": "application/geo+json",
};

export async function openReportTool(page: Page) {
  await page.goto("/en/reports");

  await expect(
    page.getByRole("heading", { name: "Get insights on your area of interest" }),
  ).toBeVisible({
    timeout: 30_000,
  });
  await expect(page.locator("button").filter({ hasText: "Point" }).first()).toBeVisible();
  await expect(page.locator("button").filter({ hasText: "Area" }).first()).toBeVisible();
  await expect(page.locator("button").filter({ hasText: "Line" }).first()).toBeVisible();
}

async function setLocation(page: Page, type: "point" | "polyline") {
  // The bridge component exposes this only after React hydration.
  await page.waitForFunction(() => typeof window.__E2E_SET_LOCATION__ === "function", null, {
    timeout: 15_000,
  });

  await page.evaluate(
    ({ type, geometry, buffer }) => {
      window.__E2E_SET_LOCATION__!({ type, geometry, buffer });
    },
    { type, geometry: GEOMETRIES[type], buffer: DEFAULT_BUFFERS[type] },
  );
}

export async function drawPoint(page: Page) {
  await setLocation(page, "point");
}

export async function drawPolyline(page: Page) {
  await setLocation(page, "polyline");
}

export async function setBufferValue(page: Page, km: number) {
  const thumb = page.getByRole("slider");
  await thumb.waitFor({ state: "visible", timeout: 5_000 });

  const thumbBox = await thumb.boundingBox();
  const trackBox = await page.locator('[data-slot="slider"]').boundingBox();
  if (!thumbBox || !trackBox) throw new Error("Slider is not on screen");

  const fraction = (km - 1) / (100 - 1);
  const thumbCenterY = thumbBox.y + thumbBox.height / 2;

  await page.mouse.move(thumbBox.x + thumbBox.width / 2, thumbCenterY);
  await page.mouse.down();
  await page.mouse.move(trackBox.x + fraction * trackBox.width, thumbCenterY, { steps: 10 });
  await page.mouse.up();
}

export async function uploadAreaFile(page: Page, filePath: string) {
  await page.locator("button").filter({ hasText: "Upload" }).first().click();

  const dialog = page.getByRole("dialog").filter({ hasText: "Upload area file" });
  await expect(dialog).toBeVisible({ timeout: 5_000 });

  const fileInput = dialog.locator('input[type="file"]');

  // Chromium assigns some extensions an empty MIME type, which react-dropzone then
  // rejects against its accept config, so those go in through the buffer overload.
  const mimeType = MIME_OVERRIDES[path.extname(filePath).toLowerCase()];

  if (mimeType) {
    await fileInput.setInputFiles({
      name: path.basename(filePath),
      mimeType,
      buffer: fs.readFileSync(filePath),
    });
  } else {
    await fileInput.setInputFiles(filePath);
  }

  await expect(dialog).not.toBeVisible({ timeout: 30_000 });
}

export async function expectLocationCreated(page: Page) {
  await expect(page.getByRole("button", { name: "Create report" })).toBeVisible({
    timeout: 15_000,
  });
}

export async function createReportWithAllTopics(page: Page) {
  await page.getByRole("button", { name: "Create report" }).click();

  await expect(page.getByRole("dialog")).toBeVisible({ timeout: 10_000 });

  const selectAll = page.getByRole("button", { name: "Select all" });
  await expect(selectAll).toBeVisible({ timeout: 10_000 });
  await selectAll.click();

  await page.locator('button[type="submit"]').click();

  await expect(page).toHaveURL(/\/reports\/[\w-]+/, { timeout: 30_000 });
}
