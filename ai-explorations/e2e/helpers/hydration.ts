import { type Locator, expect } from "@playwright/test";

// A submit clicked before hydration is a native GET that puts every field in the URL.
export async function expectHydrated(element: Locator) {
  await expect
    .poll(
      () =>
        element.evaluate((node) => Object.keys(node).some((key) => key.startsWith("__reactFiber"))),
      { timeout: 60_000 },
    )
    .toBe(true);
}
