import { renderHook } from "@testing-library/react";
import { vi } from "vitest";

import { useModuleCoverageNote } from "./use-module-coverage-note";

const { mockCountry, mockLocation, mockGeometry, mockBoundary, mockRatio, mockQuery } = vi.hoisted(
  () => ({
    mockCountry: vi.fn(),
    mockLocation: vi.fn(),
    mockGeometry: vi.fn(),
    mockBoundary: vi.fn(),
    mockRatio: vi.fn(),
    mockQuery: vi.fn(),
  }),
);

vi.mock("next-intl", () => ({ useTranslations: () => (key: string) => key }));
vi.mock("@/lib/report/use-report-country", () => ({ useReportCountry: () => mockCountry() }));
vi.mock("@/app/(frontend)/store", () => ({ useSyncLocation: () => [mockLocation(), vi.fn()] }));
vi.mock("@/lib/location", () => ({ useLocationGeometryWithStatus: () => mockGeometry() }));
vi.mock("@/lib/country/coverage", () => ({
  useGetCountryAmazoniaBoundary: (...args: unknown[]) => {
    mockQuery(...args);
    return { data: mockBoundary() };
  },
  getCountryCoverageRatio: () => mockRatio(),
  getCountryCoveragePercent: (ratio: number) => Math.round(ratio * 100),
}));

beforeEach(() => {
  mockCountry.mockReturnValue(["ECU"]);
  mockLocation.mockReturnValue({ type: "polygon" });
  mockGeometry.mockReturnValue({ geometry: { type: "polygon" }, isCalculating: false });
  mockBoundary.mockReturnValue({ type: "boundary" });
  mockRatio.mockReturnValue(1);
  mockQuery.mockClear();
});

describe("useModuleCoverageNote", () => {
  it("returns null for a report without a module", () => {
    mockCountry.mockReturnValue([]);
    mockRatio.mockReturnValue(0);

    const { result } = renderHook(() => useModuleCoverageNote());

    expect(result.current).toBeNull();
    expect(mockQuery).toHaveBeenCalledWith("", { enabled: false });
  });

  it("returns null when the report country is null", () => {
    mockCountry.mockReturnValue(null);

    expect(renderHook(() => useModuleCoverageNote()).result.current).toBeNull();
  });

  it("returns the outside note at 0% coverage", () => {
    mockRatio.mockReturnValue(0);

    const { result } = renderHook(() => useModuleCoverageNote());

    expect(result.current).toEqual({
      key: "edit-location-confirm-dialog-module-outside",
      values: { name: "country-module-ECU-name" },
    });
    expect(mockQuery).toHaveBeenCalledWith("ECU", { enabled: true });
  });

  it("returns the partial note with the outside percent", () => {
    mockRatio.mockReturnValue(0.7);

    expect(renderHook(() => useModuleCoverageNote()).result.current).toEqual({
      key: "edit-location-confirm-dialog-module-partial",
      values: { name: "country-module-ECU-name", percent: 30 },
    });
  });

  it("returns null when fully inside", () => {
    expect(renderHook(() => useModuleCoverageNote()).result.current).toBeNull();
  });

  it("caps a tiny positive ratio at 99% outside", () => {
    mockRatio.mockReturnValue(0.003);

    expect(renderHook(() => useModuleCoverageNote()).result.current).toEqual({
      key: "edit-location-confirm-dialog-module-partial",
      values: { name: "country-module-ECU-name", percent: 99 },
    });
  });

  it("returns null when the ratio rounds to fully inside", () => {
    mockRatio.mockReturnValue(0.998);

    expect(renderHook(() => useModuleCoverageNote()).result.current).toBeNull();
  });

  it.each([
    [
      "geometry missing",
      () => mockGeometry.mockReturnValue({ geometry: null, isCalculating: false }),
    ],
    [
      "geometry calculating",
      () => mockGeometry.mockReturnValue({ geometry: { type: "polygon" }, isCalculating: true }),
    ],
    ["boundary pending", () => mockBoundary.mockReturnValue(undefined)],
  ])("returns null while pending (%s)", (_label, arrange) => {
    mockRatio.mockReturnValue(0);
    arrange();

    expect(renderHook(() => useModuleCoverageNote()).result.current).toBeNull();
  });
});
