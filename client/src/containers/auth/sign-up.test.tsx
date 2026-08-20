import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";

const mockCreate = vi.fn();
const mockPush = vi.fn();

vi.mock("@/services/sdk", () => ({
  sdk: {
    create: (...args: unknown[]) => mockCreate(...args),
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
  useRouter: () => ({ push: mockPush }),
}));

import { SignupForm } from "./sign-up";

const fillRequiredFields = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.type(screen.getByLabelText("auth-field-name"), "Test User");
  await user.type(screen.getByLabelText("auth-field-email"), "test@example.com");
  await user.type(screen.getByLabelText("auth-field-password"), "password123");
  await user.type(screen.getByLabelText("auth-field-confirm-password"), "password123");
};

const submit = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.click(screen.getByRole("button", { name: "auth-button-create-account" }));
};

describe("SignupForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCreate.mockResolvedValue({ id: "user-1" });
  });

  it("renders the community opt-in checkbox unticked by default", () => {
    render(<SignupForm />);

    expect(screen.getByRole("checkbox")).not.toBeChecked();
    expect(screen.getByText(/auth-community-optin-label/)).toBeInTheDocument();
    expect(screen.getByText("auth-community-optin-optional")).toBeInTheDocument();
  });

  it("renders the terms agreement as text rather than a checkbox", () => {
    render(<SignupForm />);

    expect(screen.getByText(/auth-agreement-text/)).toBeInTheDocument();
    expect(screen.getAllByRole("checkbox")).toHaveLength(1);
  });

  it("submits with communityOptIn false when the checkbox is left unticked", async () => {
    const user = userEvent.setup();
    render(<SignupForm />);

    await fillRequiredFields(user);
    await submit(user);

    await waitFor(() => {
      expect(mockCreate).toHaveBeenCalledWith({
        collection: "users",
        data: expect.objectContaining({ communityOptIn: false }),
      });
    });
  });

  it("submits with communityOptIn true when the checkbox is ticked", async () => {
    const user = userEvent.setup();
    render(<SignupForm />);

    await fillRequiredFields(user);
    await user.click(screen.getByRole("checkbox"));
    await submit(user);

    await waitFor(() => {
      expect(mockCreate).toHaveBeenCalledWith({
        collection: "users",
        data: expect.objectContaining({ communityOptIn: true }),
      });
    });
  });

  it("still blocks submission when passwords do not match", async () => {
    const user = userEvent.setup();
    render(<SignupForm />);

    await user.type(screen.getByLabelText("auth-field-name"), "Test User");
    await user.type(screen.getByLabelText("auth-field-email"), "test@example.com");
    await user.type(screen.getByLabelText("auth-field-password"), "password123");
    await user.type(screen.getByLabelText("auth-field-confirm-password"), "different");
    await submit(user);

    await waitFor(() => {
      expect(screen.getByText("auth-validation-passwords-no-match")).toBeInTheDocument();
    });
    expect(mockCreate).not.toHaveBeenCalled();
  });
});
