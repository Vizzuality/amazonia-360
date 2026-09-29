import { renderHook } from "@testing-library/react";
import { vi } from "vitest";

import { useReportModules } from "./use-report-modules";

const { mockCountry } = vi.hoisted(() => ({ mockCountry: vi.fn() }));

vi.mock("@/lib/report/use-report-country", () => ({ useReportCountry: () => mockCountry() }));

beforeEach(() => {
  vi.stubEnv("NEXT_PUBLIC_FEATURE_FLAGS", "country-module");
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("useReportModules", () => {
  it("returns the module name, not the country name, for a country report", () => {
    mockCountry.mockReturnValue(["ECU"]);

    const { result } = renderHook(() => useReportModules());

    expect(result.current).toEqual([
      { code: "ECU", name: "country-module-ECU-module-name", flagSrc: "/images/flags/ECU.png" },
    ]);
  });

  it.each([
    ["no module", null],
    ["an empty module list", []],
  ])("returns the Amazon Region for a report with %s", (_name, country) => {
    mockCountry.mockReturnValue(country);

    const { result } = renderHook(() => useReportModules());

    expect(result.current).toEqual([{ code: null, name: "country-module-amazon-region-name" }]);
  });

  it("returns nothing with the country-module flag off", () => {
    vi.stubEnv("NEXT_PUBLIC_FEATURE_FLAGS", "");
    mockCountry.mockReturnValue(["ECU"]);

    const { result } = renderHook(() => useReportModules());

    expect(result.current).toBeNull();
  });
});
