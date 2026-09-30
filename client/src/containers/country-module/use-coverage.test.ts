import { renderHook } from "@testing-library/react";
import { vi } from "vitest";

import { useCountryModuleCoverage } from "./use-coverage";

const {
  mockCountry,
  mockPathname,
  mockLocation,
  mockGeometry,
  mockBoundary,
  mockRatio,
  mockQuery,
} = vi.hoisted(() => ({
  mockCountry: vi.fn(),
  mockPathname: vi.fn(),
  mockLocation: vi.fn(),
  mockGeometry: vi.fn(),
  mockBoundary: vi.fn(),
  mockRatio: vi.fn(),
  mockQuery: vi.fn(),
}));

vi.mock("@/i18n/navigation", () => ({ usePathname: () => mockPathname() }));
vi.mock("@/i18n/use-country", () => ({ useCountry: () => mockCountry() }));
vi.mock("@/app/(frontend)/store", () => ({ useSyncLocation: () => [mockLocation(), vi.fn()] }));
vi.mock("@/lib/location", () => ({ useLocationGeometry: () => mockGeometry() }));
vi.mock("@/lib/country/coverage", () => ({
  useGetCountryAmazoniaBoundary: (...args: unknown[]) => {
    mockQuery(...args);
    return { data: mockBoundary() };
  },
  getCountryCoverageRatio: () => mockRatio(),
}));

const GEOMETRY = { type: "polygon" };
const BOUNDARY = { type: "boundary" };

beforeEach(() => {
  mockCountry.mockReturnValue("ECU");
  mockPathname.mockReturnValue("/ECU/reports/grid");
  mockLocation.mockReturnValue({ type: "polygon" });
  mockGeometry.mockReturnValue(GEOMETRY);
  mockBoundary.mockReturnValue(BOUNDARY);
  mockRatio.mockReturnValue(0.5);
  mockQuery.mockClear();
});

describe("useCountryModuleCoverage", () => {
  test("no-area without a location", () => {
    mockLocation.mockReturnValue(null);

    const { result } = renderHook(() => useCountryModuleCoverage());

    expect(result.current.status).toBe("no-area");
    expect(mockQuery).toHaveBeenCalledWith("ECU", { enabled: false });
  });

  test.each([
    ["regional path", () => mockCountry.mockReturnValue(null)],
    ["unscoped path", () => mockPathname.mockReturnValue("/webshot/report")],
    ["saved report path", () => mockPathname.mockReturnValue("/reports/abc")],
  ])("no-area on a %s even with an area", (_name, arrange) => {
    arrange();

    const { result } = renderHook(() => useCountryModuleCoverage());

    expect(result.current.status).toBe("no-area");
    expect(mockQuery).toHaveBeenCalledWith(expect.any(String), { enabled: false });
  });

  test.each([
    ["boundary loading", () => mockBoundary.mockReturnValue(undefined)],
    ["boundary null", () => mockBoundary.mockReturnValue(null)],
    ["geometry resolving", () => mockGeometry.mockReturnValue(null)],
  ])("pending while %s", (_name, arrange) => {
    arrange();
    mockRatio.mockReturnValue(0);

    const { result } = renderHook(() => useCountryModuleCoverage());

    expect(result.current.status).toBe("pending");
  });

  test("outside when the resolved ratio is exactly 0", () => {
    mockRatio.mockReturnValue(0);

    const { result } = renderHook(() => useCountryModuleCoverage());

    expect(result.current).toEqual({ status: "outside", ratio: 0, geometry: GEOMETRY });
  });

  test.each([0.3, 1])("inside for ratio %s", (ratio) => {
    mockRatio.mockReturnValue(ratio);

    const { result } = renderHook(() => useCountryModuleCoverage());

    expect(result.current.status).toBe("inside");
    expect(result.current.ratio).toBe(ratio);
  });
});
