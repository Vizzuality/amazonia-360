import { test } from "./fixtures";
import { skipWithoutCredentials } from "./helpers/credentials";
import { SignInPage } from "./pages/sign-in.page";
import { SignUpPage } from "./pages/sign-up.page";

test.skip(skipWithoutCredentials, "E2E test user credentials not set");

test.describe("auth pages are closed to a signed-in user", () => {
  test("sign-in sends you to my-reports", async ({ page }) => {
    const signInPage = new SignInPage(page);
    await signInPage.goto();

    await signInPage.expectRedirectedTo(/\/private\/my-reports/);
  });

  test("sign-up sends you to my-reports", async ({ page }) => {
    const signUpPage = new SignUpPage(page);
    await signUpPage.goto();

    await signUpPage.expectRedirectedTo(/\/private\/my-reports/);
  });

  test("sign-in honours the redirectUrl it was given", async ({ page }) => {
    const signInPage = new SignInPage(page);
    await signInPage.goto("/reports");

    await signInPage.expectRedirectedTo(/\/reports/);
  });
});
