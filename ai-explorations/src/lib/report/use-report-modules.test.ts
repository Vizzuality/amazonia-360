// @vitest-environment jsdom
import { renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { CountryModule } from "@/payload-types";
import { ECU_MODULE } from "@integration/fixtures/country-modules";

import { useReportModules, useReportModulesFromEntries } from "./use-report-modules";

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
  vi.stubEnv("VITE_FEATURE_FLAGS", "country-module");
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
    vi.stubEnv("VITE_FEATURE_FLAGS", "");
    mockCountry.mockReturnValue(["ECU"]);

    const { result } = renderHook(() => useReportModules());

    expect(result.current).toBeNull();
  });
});

describe("useReportModulesFromEntries", () => {
  const payloadFields = { tag: "ecu", order: 0, updatedAt: "", createdAt: "", bbox: undefined };
  const ecuEntry: CountryModule = { ...ECU_MODULE, ...payloadFields };
  const peruEntry: CountryModule = {
    ...ECU_MODULE,
    ...payloadFields,
    id: "peru-module",
    slug: "ECU-N",
  };

  it("resolves bare ids to the module name and flag", () => {
    const { result } = renderHook(() => useReportModulesFromEntries([ECU_MODULE.id]));

    expect(result.current).toEqual([
      { code: "ECU", name: "Ecuador Amazonia", flagSrc: "/images/flags/ECU.png" },
    ]);
  });

  it("resolves populated module objects", () => {
    const { result } = renderHook(() => useReportModulesFromEntries([ecuEntry]));

    expect(result.current).toEqual([
      { code: "ECU", name: "Ecuador Amazonia", flagSrc: "/images/flags/ECU.png" },
    ]);
  });

  it("drops entries whose id is not in the active list", () => {
    const { result } = renderHook(() => useReportModulesFromEntries([ECU_MODULE.id, peruEntry]));

    expect(result.current).toHaveLength(1);
  });

  it.each([
    ["no modules", null],
    ["undefined modules", undefined],
    ["an empty module list", []],
  ])("returns the Amazon Region for a report with %s", (_name, entries) => {
    const { result } = renderHook(() => useReportModulesFromEntries(entries));

    expect(result.current).toEqual([{ code: null, name: "country-module-amazon-region-name" }]);
  });

  it("returns no modules when no entry resolves", () => {
    const { result } = renderHook(() => useReportModulesFromEntries(["unknown-id"]));

    expect(result.current).toEqual([]);
  });

  it("returns nothing with the country-module flag off", () => {
    vi.stubEnv("VITE_FEATURE_FLAGS", "");

    const { result } = renderHook(() => useReportModulesFromEntries([ECU_MODULE.id]));

    expect(result.current).toBeNull();
  });
});
