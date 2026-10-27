import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockSignInFn = vi.fn();
const mockPush = vi.fn();
const mockUpdateSession = vi.fn();

vi.mock("@/lib/auth/session.functions", () => ({
  signInFn: (...args: unknown[]) => mockSignInFn(...args),
}));

vi.mock("sonner", () => ({
  toast: {
    promise: vi.fn((promise: Promise<unknown>) => promise.catch(() => {})),
  },
}));

vi.mock("@/lib/navigation", () => ({
  useSearchParams: () => new URLSearchParams("redirectUrl=/reports"),
}));

vi.mock("@/lib/auth/react", () => ({
  useSession: () => ({ update: mockUpdateSession }),
}));

vi.mock("@/i18n/navigation", () => ({
  Link: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
  useRouter: () => ({ push: mockPush }),
}));

import { SignInForm } from "./sign-in";

const signIn = async (user: ReturnType<typeof userEvent.setup>) => {
  render(<SignInForm />);

  await user.type(screen.getByLabelText("auth-field-email"), "user@example.com");
  await user.type(screen.getByLabelText("auth-field-password"), "password123");
  await user.click(screen.getByRole("button", { name: "auth-button-login" }));
};

describe("SignInForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSignInFn.mockResolvedValue({ success: true });
    mockUpdateSession.mockResolvedValue({ user: { id: "user-1" } });
  });

  it("refreshes the client session before navigating, so the header is not stale", async () => {
    const order: string[] = [];
    mockUpdateSession.mockImplementation(async () => {
      order.push("update");
    });
    mockPush.mockImplementation(() => {
      order.push("push");
    });

    await signIn(userEvent.setup());

    await waitFor(() => expect(mockPush).toHaveBeenCalled());
    expect(order).toEqual(["update", "push"]);
  });

  it("navigates to the redirectUrl it was given", async () => {
    await signIn(userEvent.setup());

    await waitFor(() => expect(mockPush).toHaveBeenCalledWith("/reports"));
  });

  it("stays put when the credentials are rejected", async () => {
    mockSignInFn.mockResolvedValue({ success: false, reason: "credentials" });

    await signIn(userEvent.setup());

    await waitFor(() => expect(mockSignInFn).toHaveBeenCalled());
    expect(mockUpdateSession).not.toHaveBeenCalled();
    expect(mockPush).not.toHaveBeenCalled();
  });

  it("shows an error for an invalid email once the field is touched", async () => {
    const user = userEvent.setup();
    render(<SignInForm />);

    await user.type(screen.getByLabelText("auth-field-email"), "not-an-email");
    await user.click(screen.getByLabelText("auth-field-password"));

    await waitFor(() => {
      expect(screen.getByText("auth-validation-email-invalid")).toBeInTheDocument();
    });
    expect(mockSignInFn).not.toHaveBeenCalled();
  });

  it("shows an error for a password under 6 characters once the field is touched", async () => {
    const user = userEvent.setup();
    render(<SignInForm />);

    await user.type(screen.getByLabelText("auth-field-password"), "12345");
    await user.click(screen.getByLabelText("auth-field-email"));

    await waitFor(() => {
      expect(screen.getByText("auth-validation-password-min-length")).toBeInTheDocument();
    });
    expect(mockSignInFn).not.toHaveBeenCalled();
  });

  it("shows both errors after typing and clearing an empty form", async () => {
    const user = userEvent.setup();
    render(<SignInForm />);

    const emailInput = screen.getByLabelText("auth-field-email");
    const passwordInput = screen.getByLabelText("auth-field-password");

    await user.type(emailInput, "x");
    await user.clear(emailInput);
    await user.type(passwordInput, "x");
    await user.clear(passwordInput);

    await waitFor(() => {
      expect(screen.getByText("auth-validation-email-invalid")).toBeInTheDocument();
      expect(screen.getByText("auth-validation-password-min-length")).toBeInTheDocument();
    });
  });

  it("links to the forgot-password page", () => {
    render(<SignInForm />);

    expect(screen.getByRole("link", { name: "auth-link-forgot-password" })).toHaveAttribute(
      "href",
      "/auth/forgot-password",
    );
  });

  it("links to the sign-up page", () => {
    render(<SignInForm />);

    expect(screen.getByRole("link", { name: "auth-link-sign-up" })).toHaveAttribute(
      "href",
      "/auth/sign-up",
    );
  });
});
