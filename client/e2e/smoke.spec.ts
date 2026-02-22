import { test, expect } from "./fixtures";
import { LOCALES, type Locale } from "./helpers/locale";
import { HomePage } from "./pages/home.page";
import { LanguageSelector } from "./pages/language-selector.page";

/** Dismiss the cookies consent dialog regardless of locale. */
async function dismissCookieConsent(page: import("@playwright/test").Page) {
  // Button text varies by locale: Accept (en), Aceptar (es), Aceitar (pt)
  const acceptBtn = page.getByRole("button", { name: /^accept|^aceptar|^aceitar/i });
  await acceptBtn.click({ timeout: 5_000 }).catch(() => {});
  await acceptBtn.waitFor({ state: "hidden", timeout: 5_000 }).catch(() => {});
}

test.describe("homepage", () => {
  for (const locale of LOCALES) {
    test(`loads for locale: ${locale}`, async ({ page }) => {
      const homePage = new HomePage(page);
      await homePage.goto(locale);
      await homePage.expectLoaded();
      await homePage.expectLocale(locale);
    });
  }
});

test.describe("language switching", () => {
  const switchCases: { from: Locale; to: Locale }[] = [
    { from: "en", to: "es" },
    { from: "es", to: "pt" },
    { from: "pt", to: "en" },
  ];

  for (const { from, to } of switchCases) {
    test(`switches from ${from} to ${to}`, async ({ page }) => {
      const homePage = new HomePage(page);
      const langSelector = new LanguageSelector(page);

      await homePage.goto(from);
      await homePage.expectLoaded();
      await dismissCookieConsent(page);

      await langSelector.switchTo(to);

      await homePage.expectLocale(to);
      await langSelector.expectCurrentLocale(to);
    });
  }
});
