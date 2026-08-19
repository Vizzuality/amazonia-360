import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { toast } from "sonner";
import { vi } from "vitest";

const mockMutateAsync = vi.fn();
const mockUseUser = vi.fn();

vi.mock("next-auth/react", () => ({
  useSession: () => ({ data: { user: { id: "user-1" } }, status: "authenticated" }),
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
  },
}));

vi.mock("@/lib/user", () => ({
  useUser: () => mockUseUser(),
  useUpdateUserCommunityOptIn: () => ({
    mutateAsync: mockMutateAsync,
    isPending: false,
  }),
}));

import { CommunicationsForm } from "./communications";

describe("CommunicationsForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockMutateAsync.mockResolvedValue({ id: "user-1" });
    mockUseUser.mockReturnValue({ data: { id: "user-1", communityOptIn: false } });
  });

  it("reflects an opted-out user", async () => {
    render(<CommunicationsForm />);

    await waitFor(() => {
      expect(screen.getByRole("checkbox")).not.toBeChecked();
    });
  });

  it("reflects an opted-in user", async () => {
    mockUseUser.mockReturnValue({ data: { id: "user-1", communityOptIn: true } });
    render(<CommunicationsForm />);

    await waitFor(() => {
      expect(screen.getByRole("checkbox")).toBeChecked();
    });
  });

  it("shows no control while the user is still loading", async () => {
    mockUseUser.mockReturnValue({ data: undefined, isLoading: true });
    render(<CommunicationsForm />);

    expect(screen.queryByRole("checkbox")).not.toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("reports an inline error when the user cannot be read", async () => {
    mockUseUser.mockReturnValue({ data: undefined, isError: true });
    render(<CommunicationsForm />);

    expect(screen.getByRole("alert")).toHaveTextContent("profile-communications-load-error");
    expect(screen.queryByRole("checkbox")).not.toBeInTheDocument();
  });

  it("saves an opt-in", async () => {
    const user = userEvent.setup();
    render(<CommunicationsForm />);

    await user.click(screen.getByRole("checkbox"));
    await user.click(screen.getByRole("button", { name: "profile-button-update-communications" }));

    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalledWith({ id: "user-1", communityOptIn: true });
    });
  });

  it("adopts a newer server value instead of the value captured on mount", async () => {
    const { rerender } = render(<CommunicationsForm />);

    await waitFor(() => {
      expect(screen.getByRole("checkbox")).not.toBeChecked();
    });

    mockUseUser.mockReturnValue({ data: { id: "user-1", communityOptIn: true } });
    rerender(<CommunicationsForm />);

    await waitFor(() => {
      expect(screen.getByRole("checkbox")).toBeChecked();
    });

    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "profile-button-update-communications" }));

    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalledWith({ id: "user-1", communityOptIn: true });
    });
  });

  it("keeps a failed save visible inline instead of a toast", async () => {
    mockMutateAsync.mockRejectedValue(new Error("Forbidden"));
    const user = userEvent.setup();
    render(<CommunicationsForm />);

    await user.click(screen.getByRole("checkbox"));
    await user.click(screen.getByRole("button", { name: "profile-button-update-communications" }));

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent("Forbidden");
    });

    expect(toast.success).not.toHaveBeenCalled();
    expect(screen.getByRole("alert")).toBeInTheDocument();
  });

  it("saves an opt-out", async () => {
    mockUseUser.mockReturnValue({ data: { id: "user-1", communityOptIn: true } });
    const user = userEvent.setup();
    render(<CommunicationsForm />);

    await waitFor(() => {
      expect(screen.getByRole("checkbox")).toBeChecked();
    });

    await user.click(screen.getByRole("checkbox"));
    await user.click(screen.getByRole("button", { name: "profile-button-update-communications" }));

    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalledWith({ id: "user-1", communityOptIn: false });
    });
  });
});
