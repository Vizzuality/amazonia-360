import { createElement, Suspense, type ReactNode } from "react";

import { useParams } from "next/navigation";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";

import { Report } from "@/payload-types";

vi.mock("next/navigation", () => ({ useParams: vi.fn() }));
vi.mock("@/services/sdk", () => ({ sdk: { findByID: vi.fn() } }));
vi.mock("@/lib/country-modules", () => ({
  useGetCountryModules: () => [{ id: "mod-ecu", slug: "ECU" }],
}));

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

afterEach(() => vi.unstubAllEnvs());

describe("useReportCountry", () => {
  it("reads the report's stored module, not the URL's", async () => {
    findByIDMock.mockResolvedValue({ modules: ["mod-ecu"] } as Report);

    const { result } = renderHook(() => useReportCountry(), { wrapper: getWrapper() });

    await waitFor(() => expect(result.current).toEqual(["ECU"]));
  });

  it("drops a module the reader can't see", async () => {
    const reportPromise = Promise.resolve({ modules: ["mod-inactive"] } as Report);
    findByIDMock.mockReturnValue(reportPromise);

    const { result } = renderHook(() => useReportCountry(), { wrapper: getWrapper() });

    await act(async () => {
      await reportPromise;
    });

    expect(result.current).toBeNull();
  });

  it("returns null for a report saved before country modules existed", async () => {
    findByIDMock.mockResolvedValue({ modules: null } as Report);

    const { result } = renderHook(() => useReportCountry(), { wrapper: getWrapper() });

    await waitFor(() => expect(result.current).toBeNull());
  });

  it("returns null for a regional report, which the CMS stores as an empty list", async () => {
    const reportPromise = Promise.resolve({ modules: [] } as unknown as Report);
    findByIDMock.mockReturnValue(reportPromise);

    const { result } = renderHook(() => useReportCountry(), { wrapper: getWrapper() });

    await act(async () => {
      await reportPromise;
    });

    expect(result.current).toBeNull();
  });

  it("ignores the stored module when the flag is off", async () => {
    vi.stubEnv("NEXT_PUBLIC_FEATURE_FLAGS", "");
    const reportPromise = Promise.resolve({ modules: ["mod-ecu"] } as Report);
    findByIDMock.mockReturnValue(reportPromise);

    const { result } = renderHook(() => useReportCountry(), { wrapper: getWrapper() });

    await act(async () => {
      await reportPromise;
    });

    expect(result.current).toBeNull();
  });
});
