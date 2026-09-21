import { type Locator, type Page, expect } from "@playwright/test";

import { type Locale } from "../helpers/locale";

export class HomePage {
  readonly page: Page;
  readonly heroHeading: Locator;
  readonly reportToolLink: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heroHeading = page.locator("h2").first();
    this.reportToolLink = page.locator('header a[href$="/reports"]').first();
  }

  async goto(locale: Locale = "en") {
    await this.page.goto(`/${locale}`);
  }

  async expectLoaded() {
    await expect(this.heroHeading).toBeVisible({ timeout: 30_000 });
  }

  async expectLocale(locale: Locale) {
    await expect(this.page).toHaveURL(new RegExp(`^.*/${locale}(/.*)?$`));
  }
}
