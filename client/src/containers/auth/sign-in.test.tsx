import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";

const mockSignInAction = vi.fn();
const mockPush = vi.fn();
const mockUpdateSession = vi.fn();

vi.mock("@/app/(frontend)/[locale]/(app)/auth/sign-in/actions", () => ({
  signInAction: (...args: unknown[]) => mockSignInAction(...args),
}));

vi.mock("sonner", () => ({
  toast: {
    promise: vi.fn((promise: Promise<unknown>) => promise.catch(() => {})),
  },
}));

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams("redirectUrl=/reports"),
}));

vi.mock("next-auth/react", () => ({
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
    mockSignInAction.mockResolvedValue({ success: true });
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
    mockSignInAction.mockResolvedValue({ success: false, reason: "credentials" });

    await signIn(userEvent.setup());

    await waitFor(() => expect(mockSignInAction).toHaveBeenCalled());
    expect(mockUpdateSession).not.toHaveBeenCalled();
    expect(mockPush).not.toHaveBeenCalled();
  });
});
