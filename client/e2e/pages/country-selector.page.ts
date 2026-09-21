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

  async switchTo(country: string | null) {
    await this.open();
    await this.page.getByRole("link", { name: new RegExp(this.name(country)) }).click();
  }

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
}
