import type { Locator, Page } from "@playwright/test";

/** Wait for the ArcGIS map canvas to be visible and the SketchViewModel to initialise. */
export async function waitForMapCanvas(page: Page): Promise<Locator> {
  const mapContainer = page.locator("#map-default");
  await mapContainer.waitFor({ state: "visible", timeout: 30_000 });

  const canvas = mapContainer.locator(".esri-view-surface canvas").first();
  await canvas.waitFor({ state: "visible", timeout: 30_000 });

  // Allow MapView.when() promise to resolve and SketchViewModel to initialise
  await page.waitForTimeout(3_000);

  return canvas;
}

/** Return the centre pixel of the given canvas element. */
export async function getCanvasCenter(canvas: Locator) {
  const box = await canvas.boundingBox();
  if (!box) throw new Error("Canvas bounding box not available");
  return { x: Math.round(box.width / 2), y: Math.round(box.height / 2) };
}

/** Single-click the canvas at the given position. */
export async function clickCanvas(
  canvas: Locator,
  pos: { x: number; y: number },
) {
  await canvas.click({ position: pos });
}

/** Double-click the canvas at the given position. */
export async function dblClickCanvas(
  canvas: Locator,
  pos: { x: number; y: number },
) {
  await canvas.dblclick({ position: pos });
}
