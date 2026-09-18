import { test } from "./fixtures";
import { LOCALES } from "./helpers/locale";
import { HomePage } from "./pages/home.page";

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
