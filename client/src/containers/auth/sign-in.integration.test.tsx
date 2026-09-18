import { beforeEach, describe, expect, it, vi } from "vitest";
import { userEvent } from "vitest/browser";

import { signInAction } from "@/app/(frontend)/[locale]/(app)/auth/sign-in/actions";

import en from "@/i18n/translations/en.json";
import { renderWithProviders } from "@integration/wrappers/render";

import { SignInForm } from "./sign-in";

describe("SignInForm", () => {
  beforeEach(() => {
    vi.mocked(signInAction).mockReset();
    vi.mocked(signInAction).mockResolvedValue({ success: true });
  });

  it("renders without accessibility violations", async () => {
    const { screen } = await renderWithProviders(<SignInForm />);

    await expect
      .element(screen.getByRole("button", { name: en["auth-button-login"] }))
      .toBeVisible();
    await expect(screen).toHaveNoA11yViolations();
  });

  it("flags the email field once a malformed address loses focus", async () => {
    const { screen } = await renderWithProviders(<SignInForm />);

    const email = screen.getByLabelText(en["auth-field-email"]);
    await userEvent.fill(email, "not-an-email");
    await userEvent.click(screen.getByLabelText(en["auth-field-password"]));

    await expect.element(email).toHaveAttribute("aria-invalid", "true");
    await expect
      .element(screen.getByRole("alert"))
      .toHaveTextContent(en["auth-validation-email-invalid"]);
  });
});
