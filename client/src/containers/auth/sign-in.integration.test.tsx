import { describe, expect, it } from "vitest";

import en from "@/i18n/translations/en.json";
import { renderWithProviders } from "@integration/wrappers/render";

import { SignInForm } from "./sign-in";

describe("SignInForm", () => {
  it("renders without accessibility violations", async () => {
    const { screen } = await renderWithProviders(<SignInForm />);

    await expect
      .element(screen.getByRole("button", { name: en["auth-button-login"] }))
      .toBeVisible();
    await expect(screen).toHaveNoA11yViolations();
  });
});
