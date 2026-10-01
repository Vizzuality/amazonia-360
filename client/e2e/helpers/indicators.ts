import type { Locator, Page } from "@playwright/test";

/**
 * An indicator's row in the indicators panel: the innermost element holding both the name
 * button and the toggle, which is what separates it from the subtopic and topic rows
 * wrapping it.
 */
export const indicatorRow = (page: Page, panel: Locator, name: string) =>
  panel
    .locator("div")
    .filter({ has: page.getByRole("button", { name, exact: true }) })
    .filter({ has: page.getByRole("switch") })
    .last();

/** The row's second button opens the indicator's info dialog; the first toggles it. */
export const infoButton = (row: Locator) => row.getByRole("button").nth(1);
