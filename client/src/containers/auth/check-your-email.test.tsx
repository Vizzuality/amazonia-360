import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// Override the global next-intl mock to return keys for readable assertions
jest.mock("next-intl", () => ({
  useTranslations: jest.fn().mockReturnValue((key: string) => key),
}));

jest.mock("sonner", () => ({
  toast: {
    promise: jest.fn((promise: Promise<unknown>) => promise.catch(() => {})),
  },
}));

jest.mock("@/i18n/navigation", () => ({
  Link: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

// Mock fetch globally
const mockFetch = jest.fn();
globalThis.fetch = mockFetch;

import { CheckYourEmail } from "./check-your-email";

describe("CheckYourEmail", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ message: "Success" }),
    });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("renders the card with title and description", () => {
    render(<CheckYourEmail />);

    expect(screen.getByText("auth-check-email-title")).toBeInTheDocument();
    expect(screen.getByText("auth-check-email-description")).toBeInTheDocument();
  });

  it("renders back to sign in link", () => {
    render(<CheckYourEmail />);

    expect(screen.getByText("auth-link-back-to-sign-in")).toBeInTheDocument();
  });

  it("does not render resend button when email is not provided", () => {
    render(<CheckYourEmail />);

    expect(screen.queryByText("auth-check-email-resend-button")).not.toBeInTheDocument();
  });

  it("renders resend button when email is provided", () => {
    render(<CheckYourEmail email="test@example.com" />);

    expect(screen.getByText("auth-check-email-resend-button")).toBeInTheDocument();
  });

  it("calls the resend endpoint when button is clicked", async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    render(<CheckYourEmail email="test@example.com" />);

    await user.click(screen.getByText("auth-check-email-resend-button"));

    expect(mockFetch).toHaveBeenCalledWith("/v1/api/users/resend-verification", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "test@example.com" }),
    });
  });

  it("disables the button and shows countdown after clicking", async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    render(<CheckYourEmail email="test@example.com" />);

    await user.click(screen.getByText("auth-check-email-resend-button"));

    // Button should now show countdown text and be disabled
    const button = screen.getByText("auth-check-email-resend-button-countdown");
    expect(button.closest("button")).toBeDisabled();
  });

  it("re-enables the button after cooldown expires", async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    render(<CheckYourEmail email="test@example.com" />);

    await user.click(screen.getByText("auth-check-email-resend-button"));

    // Fast-forward past the 30-second cooldown
    act(() => {
      jest.advanceTimersByTime(30_000);
    });

    await waitFor(() => {
      const button = screen.getByText("auth-check-email-resend-button");
      expect(button.closest("button")).not.toBeDisabled();
    });
  });
});
