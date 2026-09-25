import { createElement, type ReactNode } from "react";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";

import { User } from "@/payload-types";

vi.mock("@/services/sdk", () => ({ sdk: { update: vi.fn() } }));

const { useUpdateUserCommunications } = await import("@/lib/user");
const { sdk } = await import("@/services/sdk");

const updateMock = vi.mocked(sdk.update);

function getWrapper(queryClient: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return createElement(QueryClientProvider, { client: queryClient }, children);
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("useUpdateUserCommunications", () => {
  it("saves communityOptIn and countriesOfInterest in one update", async () => {
    updateMock.mockResolvedValue({} as User);
    const queryClient = new QueryClient();

    const { result } = renderHook(() => useUpdateUserCommunications(), {
      wrapper: getWrapper(queryClient),
    });

    result.current.mutate({
      id: "user-1",
      communityOptIn: true,
      countriesOfInterest: ["BRA", "PER"],
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(updateMock).toHaveBeenCalledTimes(1);
    expect(updateMock).toHaveBeenCalledWith({
      collection: "users",
      id: "user-1",
      data: { communityOptIn: true, countriesOfInterest: ["BRA", "PER"] },
    });
  });

  it("invalidates the user query on success", async () => {
    updateMock.mockResolvedValue({} as User);
    const queryClient = new QueryClient();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

    const { result } = renderHook(() => useUpdateUserCommunications(), {
      wrapper: getWrapper(queryClient),
    });

    result.current.mutate({
      id: "user-1",
      communityOptIn: false,
      countriesOfInterest: [],
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["user", "user-1"] });
  });
});
