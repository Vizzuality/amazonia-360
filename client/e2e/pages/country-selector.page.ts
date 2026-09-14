import { type Page, expect } from "@playwright/test";

import { type Locale } from "../helpers/locale";

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

const REGION_NAME: Record<Locale, string> = {
  en: "Amazon Region",
  es: "Región Amazónica",
  pt: "Região Amazônica",
};

/** Only the countries the specs name. Names are translated per locale. */
const COUNTRY_NAMES: Record<Locale, Record<string, string>> = {
  en: { ECU: "Ecuador", SUR: "Suriname" },
  es: { ECU: "Ecuador", SUR: "Surinam" },
  pt: { ECU: "Equador", SUR: "Suriname" },
};

export class CountrySelector {
  readonly page: Page;
  readonly locale: Locale;

  constructor(page: Page, locale: Locale = "en") {
    this.page = page;
    this.locale = locale;
  }

  /** `null` is the Amazon Region, which has no code. */
  name(country: string | null) {
    return country === null ? REGION_NAME[this.locale] : COUNTRY_NAMES[this.locale][country];
  }

  private get trigger() {
    return this.page.getByRole("button", { name: new RegExp(SELECT_LABEL[this.locale], "i") });
  }

  async open() {
    await expect(this.trigger).toBeVisible({ timeout: 30_000 });
    await this.trigger.click();
  }

  /** Opens the picker and follows the row for `country`. */
  async switchTo(country: string | null) {
    await this.open();
    await this.page.getByRole("link", { name: new RegExp(this.name(country)) }).click();
  }

  /** Opens the picker and opens the row for `country` in a new tab, returning it. */
  async switchToInNewTab(country: string | null, how: "modifier" | "middle" = "modifier") {
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

  async expectActiveCountry(country: string | null) {
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

  async openMobileMenu() {
    await this.page.getByRole("button", { name: MENU_LABEL[this.locale] }).first().click();
    await expect(this.page.getByRole("dialog")).toBeVisible({ timeout: 10_000 });
  }

  mobileLink(country: string | null) {
    return this.page
      .getByRole("dialog")
      .getByRole("link", { name: new RegExp(this.name(country)) });
  }
}
