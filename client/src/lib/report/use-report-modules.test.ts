import { renderHook } from "@testing-library/react";
import { vi } from "vitest";

import { ECU_MODULE } from "@integration/fixtures/country-modules";

import { useReportModules } from "./use-report-modules";

const { mockCountry } = vi.hoisted(() => ({ mockCountry: vi.fn() }));

vi.mock("@/lib/report/use-report-country", () => ({ useReportCountry: () => mockCountry() }));
vi.mock("@/lib/country-modules", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/country-modules")>()),
  useGetCountryModules: () => [
    ECU_MODULE,
    { ...ECU_MODULE, slug: "ECU-N", country: "PER", moduleName: "Peru North" },
  ],
}));

beforeEach(() => {
  vi.stubEnv("NEXT_PUBLIC_FEATURE_FLAGS", "country-module");
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("useReportModules", () => {
  it("returns the CMS module name and the module country's flag", () => {
    mockCountry.mockReturnValue(["ECU"]);

    const { result } = renderHook(() => useReportModules());

    expect(result.current).toEqual([
      { code: "ECU", name: "Ecuador Amazonia", flagSrc: "/images/flags/ECU.png" },
    ]);
  });

  it("takes the flag from the module country and the code from its slug", () => {
    mockCountry.mockReturnValue(["ECU-N"]);

    const { result } = renderHook(() => useReportModules());

    expect(result.current).toEqual([
      { code: "ECU-N", name: "Peru North", flagSrc: "/images/flags/PER.png" },
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
