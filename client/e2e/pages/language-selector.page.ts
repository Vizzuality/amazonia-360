import { type Page, expect } from "@playwright/test";

import { type Locale } from "../helpers/locale";

const LOCALE_LABELS: Record<Locale, { short: string; long: string }> = {
  en: { short: "EN", long: "EN - English" },
  es: { short: "ES", long: "ES - Español" },
  pt: { short: "PT", long: "PT - Português" },
};

export class LanguageSelector {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  /** Opens the language dropdown and selects the target locale. */
  async switchTo(locale: Locale) {
    const trigger = this.page.getByRole("combobox");
    await trigger.click();

    const option = this.page.getByRole("option", { name: LOCALE_LABELS[locale].long });
    await option.click();
  }

  async expectCurrentLocale(locale: Locale) {
    const trigger = this.page.getByRole("combobox");
    await expect(trigger).toContainText(LOCALE_LABELS[locale].short);
  }
}
