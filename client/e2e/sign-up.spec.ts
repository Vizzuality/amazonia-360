import { test } from "./fixtures";
import { dismissCookieConsent } from "./helpers/cookie-consent";
import { LOCALES } from "./helpers/locale";
import { SignUpPage } from "./pages/sign-up.page";

test.describe("sign-up page rendering", () => {
  for (const locale of LOCALES) {
    test(`loads correctly for locale: ${locale}`, async ({ page }) => {
      const signUpPage = new SignUpPage(page, locale);
      await signUpPage.goto();
      await dismissCookieConsent(page);
      await signUpPage.expectLoaded();
    });
  }
});
