import { type Page, expect } from "@playwright/test";

import { AMAZON_REGION, type Locale } from "../helpers/locale";

const SELECT_LABEL: Record<Locale, string> = {
  en: "Select module",
  es: "Seleccionar módulo",
  pt: "Selecionar módulo",
};

const MENU_LABEL: Record<Locale, string> = {
  en: "AmazoniaForever360+ menu",
  es: "Menú de AmazoniaForever360+",
  pt: "Menu do AmazoniaForever360+",
};

/** Only the countries the specs name. Names are translated per locale. */
const COUNTRY_NAMES: Record<Locale, Record<string, string>> = {
  en: { [AMAZON_REGION]: "Amazon Region", ECU: "Ecuador", SUR: "Suriname" },
  es: { [AMAZON_REGION]: "Región Amazónica", ECU: "Ecuador", SUR: "Surinam" },
  pt: { [AMAZON_REGION]: "Região Amazônica", ECU: "Equador", SUR: "Suriname" },
};

export class CountrySelector {
  readonly page: Page;
  readonly locale: Locale;

  constructor(page: Page, locale: Locale = "en") {
    this.page = page;
    this.locale = locale;
  }

  name(country: string) {
    return COUNTRY_NAMES[this.locale][country];
  }

  private get trigger() {
    return this.page.getByRole("button", { name: new RegExp(SELECT_LABEL[this.locale], "i") });
  }

  async open() {
    await expect(this.trigger).toBeVisible({ timeout: 30_000 });
    await this.trigger.click();
  }

  /** Opens the picker and follows the row for `country`. */
  async switchTo(country: string) {
    await this.open();
    await this.page.getByRole("link", { name: new RegExp(this.name(country)) }).click();
  }

  /**
   * Opens the picker and opens the row for `country` in a new tab, returning it. A click
   * that means "somewhere else" has to keep working as a link, so it navigates for real.
   */
  async switchToInNewTab(country: string, how: "modifier" | "middle" = "modifier") {
    await this.open();

    const [opened] = await Promise.all([
      this.page.context().waitForEvent("page"),
      this.page
        .getByRole("link", { name: new RegExp(this.name(country)) })
        .click(how === "middle" ? { button: "middle" } : { modifiers: ["ControlOrMeta"] }),
    ]);

    await opened.waitForLoadState("domcontentloaded");
    return opened;
  }

  async expectActiveCountry(country: string) {
    await expect(this.trigger).toContainText(this.name(country));
  }

  async expectNotVisible() {
    await expect(this.trigger).toHaveCount(0);
  }

  /** A country that is configured but not yet available is listed, but not a link. */
  async expectComingSoon(country: string) {
    await this.open();
    const name = new RegExp(this.name(country));
    await expect(this.page.getByText(name).first()).toBeVisible();
    await expect(this.page.getByRole("link", { name })).toHaveCount(0);
  }

  // ---------------------------------------------------------------------------
  // Mobile: the same choice as a list inside the hamburger dialog
  // ---------------------------------------------------------------------------

  async openMobileMenu() {
    await this.page.getByRole("button", { name: MENU_LABEL[this.locale] }).first().click();
    await expect(this.page.getByRole("dialog")).toBeVisible({ timeout: 10_000 });
  }

  mobileLink(country: string) {
    return this.page
      .getByRole("dialog")
      .getByRole("link", { name: new RegExp(this.name(country)) });
  }
}
