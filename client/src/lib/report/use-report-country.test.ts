import { createElement, Suspense, type ReactNode } from "react";

import { useParams } from "next/navigation";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";

import { Report } from "@/payload-types";

vi.mock("next/navigation", () => ({ useParams: vi.fn() }));
vi.mock("@/services/sdk", () => ({ sdk: { findByID: vi.fn() } }));

const { useReportCountry } = await import("@/lib/report/use-report-country");
const { sdk } = await import("@/services/sdk");

const useParamsMock = vi.mocked(useParams);
const findByIDMock = vi.mocked(sdk.findByID);

function getWrapper() {
  const queryClient = new QueryClient();
  return function Wrapper({ children }: { children: ReactNode }) {
    return createElement(
      QueryClientProvider,
      { client: queryClient },
      createElement(Suspense, { fallback: null }, children),
    );
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  useParamsMock.mockReturnValue({ id: "report-1" });
});

describe("useReportCountry", () => {
  it("reads the report's stored module, not the URL's", async () => {
    findByIDMock.mockResolvedValue({ country: ["ECU"] } as Report);

    const { result } = renderHook(() => useReportCountry(), { wrapper: getWrapper() });

    await waitFor(() => expect(result.current).toEqual(["ECU"]));
  });

  it("returns null for a report saved before country modules existed", async () => {
    findByIDMock.mockResolvedValue({ country: null } as Report);

    const { result } = renderHook(() => useReportCountry(), { wrapper: getWrapper() });

    await waitFor(() => expect(result.current).toBeNull());
  });
});
