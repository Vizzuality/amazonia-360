import { type Locator, type Page, expect } from "@playwright/test";

import { AMAZON_REGION, type Locale, countryPath } from "../helpers/locale";

const LABELS: Record<
  Locale,
  {
    heading: string;
    expandAll: string;
    collapseAll: string;
    clearSelection: string;
  }
> = {
  en: {
    heading: "Indicators",
    expandAll: "Expand all",
    collapseAll: "Collapse all",
    clearSelection: "Clear selection",
  },
  es: {
    heading: "Indicadores",
    expandAll: "Expandir todo",
    collapseAll: "Colapsar todo",
    clearSelection: "Borrar selección",
  },
  pt: {
    heading: "Indicadores",
    expandAll: "Expandir tudo",
    collapseAll: "Colapsar tudo",
    clearSelection: "Limpar seleção",
  },
};

export class ReportIndicatorsPage {
  readonly page: Page;
  readonly locale: Locale;

  readonly panel: Locator;
  readonly heading: Locator;
  readonly topicRows: Locator;
  readonly expandAllButton: Locator;
  readonly collapseAllButton: Locator;
  readonly clearSelectionButton: Locator;

  constructor(page: Page, locale: Locale = "en") {
    this.page = page;
    this.locale = locale;

    const l = LABELS[locale];
    // Fresnel renders only the branch matching the viewport, so the desktop and the
    // mobile panel resolve to the same single `aside`.
    this.panel = page.getByRole("complementary");
    this.heading = this.panel.getByRole("heading", { name: l.heading });
    // Every topic row carries its thumbnail. Matching the `img` tag rather than the role
    // keeps the search field, whose icon is an inline SVG, out of the set.
    this.topicRows = this.panel.getByRole("button").filter({ has: page.locator("img") });
    this.expandAllButton = this.panel.getByRole("button", { name: l.expandAll });
    this.collapseAllButton = this.panel.getByRole("button", { name: l.collapseAll });
    this.clearSelectionButton = this.panel.getByRole("button", { name: l.clearSelection });
  }

  async goto(country: string = AMAZON_REGION) {
    await this.page.goto(`${countryPath(this.locale, country)}/reports/indicators`);
  }

  async expectLoaded() {
    await expect(this.heading).toBeVisible({ timeout: 30_000 });
    await expect(this.topicRows.first()).toBeVisible({ timeout: 30_000 });
    await expect(this.expandAllButton).toBeVisible();
    await expect(this.clearSelectionButton).toBeDisabled();
  }

  /** Opens a topic row and waits for its subtopics to appear. */
  async expandFirstTopic() {
    const row = this.topicRows.first();
    await row.click();
    await expect(row).toHaveAttribute("aria-expanded", "true");
    await expect(this.collapseAllButton).toBeVisible();
  }
}
