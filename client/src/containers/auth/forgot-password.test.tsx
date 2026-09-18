import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";

const mockForgotPassword = vi.fn();

vi.mock("@/services/sdk", () => ({
  sdk: {
    forgotPassword: (...args: unknown[]) => mockForgotPassword(...args),
  },
}));

vi.mock("sonner", () => ({
  toast: {
    promise: vi.fn((promise: Promise<unknown>) => promise.catch(() => {})),
  },
}));

vi.mock("@/i18n/navigation", () => ({
  Link: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

import { ForgotPasswordForm } from "./forgot-password";

describe("ForgotPasswordForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockForgotPassword.mockResolvedValue({});
  });

  it("shows an error for an invalid email once the field is touched", async () => {
    const user = userEvent.setup();
    render(<ForgotPasswordForm />);

    await user.type(screen.getByLabelText("auth-field-email"), "not-an-email");
    await user.click(screen.getByRole("button", { name: "auth-button-send-reset-link" }));

    await waitFor(() => {
      expect(screen.getByText("auth-validation-email-invalid")).toBeInTheDocument();
    });
    expect(mockForgotPassword).not.toHaveBeenCalled();
  });

  it("links back to the sign-in page", () => {
    render(<ForgotPasswordForm />);

    expect(screen.getByRole("link", { name: "auth-link-back-to-sign-in" })).toHaveAttribute(
      "href",
      "/auth/sign-in",
    );
  });
});
