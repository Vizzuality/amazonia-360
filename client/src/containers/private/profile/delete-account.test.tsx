import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";

const mockDelete = vi.fn();
const mockSignOut = vi.fn();

vi.mock("@/lib/user", () => ({
  useDeleteUser: () => ({ mutateAsync: mockDelete, isPending: false }),
}));

vi.mock("@/lib/auth/use-sign-out", () => ({
  useSignOut: () => mockSignOut,
}));

vi.mock("next-auth/react", () => ({
  useSession: () => ({ data: { user: { id: "user-1" } } }),
}));

vi.mock("sonner", () => ({
  toast: {
    promise: vi.fn((promise: Promise<unknown>) => promise.catch(() => {})),
  },
}));

import { DeleteAccount } from "./delete-account";

const deleteAccount = async (user: ReturnType<typeof userEvent.setup>) => {
  render(<DeleteAccount />);

  await user.click(screen.getByRole("button", { name: "profile-delete-account-button" }));
  await user.click(screen.getByRole("button", { name: "profile-delete-account-dialog-confirm" }));
};

describe("DeleteAccount", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDelete.mockResolvedValue({});
  });

  // Leaving by any other route keeps the client Router Cache, and with it every gated
  // page this account visited — one Back button away from rendering after deletion.
  it("leaves through the shared sign-out, which is a full page load", async () => {
    await deleteAccount(userEvent.setup());

    await waitFor(() => expect(mockSignOut).toHaveBeenCalled());
    expect(mockDelete).toHaveBeenCalledWith("user-1");
  });

  it("does not sign out when the deletion fails", async () => {
    mockDelete.mockRejectedValue(new Error("nope"));

    await deleteAccount(userEvent.setup());

    await waitFor(() => expect(mockDelete).toHaveBeenCalled());
    expect(mockSignOut).not.toHaveBeenCalled();
  });
});
