import { createElement, type ReactNode } from "react";

import * as geodeticAreaOperator from "@arcgis/core/geometry/operators/geodeticAreaOperator";
import * as intersectionOperator from "@arcgis/core/geometry/operators/intersectionOperator";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";

import { ECU_MODULE } from "@integration/fixtures/country-modules";

vi.mock("@/lib/query", () => ({ getFeatures: vi.fn() }));

const { getFeatures } = await import("@/lib/query");
const {
  getCountryAmazoniaBoundary,
  getCountryAmazoniaBoundaryKey,
  getCountryAmazoniaBoundaryOptions,
  useGetCountryAmazoniaBoundary,
  getLiveCountryBoundaries,
  getCountryCoverageRatio,
  getCountryCoveragePercent,
  isCountryCoverageDominant,
} = await import("@/lib/country/coverage");

const getFeaturesMock = vi.mocked(getFeatures);
const geodeticAreaExecute = vi.mocked(geodeticAreaOperator.execute);
const intersectionExecute = vi.mocked(intersectionOperator.execute);

const COUNTRY_GEOMETRY = { type: "polygon", rings: [[[0, 0]]] } as unknown as __esri.GeometryUnion;
const AMAZONIA_GEOMETRY = { type: "polygon", rings: [[[1, 1]]] } as unknown as __esri.GeometryUnion;
const BOUNDARY_GEOMETRY = { type: "polygon", rings: [[[2, 2]]] } as unknown as __esri.GeometryUnion;
const DRAWN_GEOMETRY = { type: "polygon", rings: [[[3, 3]]] } as unknown as __esri.GeometryUnion;

function getWrapper() {
  const queryClient = new QueryClient();
  function Wrapper({ children }: { children: ReactNode }) {
    return createElement(QueryClientProvider, { client: queryClient }, children);
  }
  return Wrapper;
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("getCountryAmazoniaBoundary", () => {
  it("skips the fetch entirely for an iso3 that is not a known country", async () => {
    await expect(getCountryAmazoniaBoundary("XXX")).resolves.toBeNull();
    expect(getFeaturesMock).not.toHaveBeenCalled();
  });

  it("intersects the country boundary with the Panamazonia working area", async () => {
    getFeaturesMock
      .mockResolvedValueOnce({ features: [{ geometry: COUNTRY_GEOMETRY }] } as never)
      .mockResolvedValueOnce({ features: [{ geometry: AMAZONIA_GEOMETRY }] } as never);
    intersectionExecute.mockReturnValue(BOUNDARY_GEOMETRY);

    await expect(getCountryAmazoniaBoundary("ECU")).resolves.toBe(BOUNDARY_GEOMETRY);
    expect(intersectionExecute).toHaveBeenCalledWith(COUNTRY_GEOMETRY, AMAZONIA_GEOMETRY);
  });

  it("resolves null when either source layer has no matching feature", async () => {
    getFeaturesMock
      .mockResolvedValueOnce({ features: [] } as never)
      .mockResolvedValueOnce({ features: [{ geometry: AMAZONIA_GEOMETRY }] } as never);

    await expect(getCountryAmazoniaBoundary("ECU")).resolves.toBeNull();
    expect(intersectionExecute).not.toHaveBeenCalled();
  });

  it("resolves null when the country and the working area do not overlap", async () => {
    getFeaturesMock
      .mockResolvedValueOnce({ features: [{ geometry: COUNTRY_GEOMETRY }] } as never)
      .mockResolvedValueOnce({ features: [{ geometry: AMAZONIA_GEOMETRY }] } as never);
    intersectionExecute.mockReturnValue(null);

    await expect(getCountryAmazoniaBoundary("ECU")).resolves.toBeNull();
  });
});

describe("getCountryAmazoniaBoundaryOptions", () => {
  it("keys the query by iso3 and disables it for an unknown iso3", () => {
    expect(getCountryAmazoniaBoundaryOptions("ECU").queryKey).toEqual(
      getCountryAmazoniaBoundaryKey("ECU"),
    );
    expect(getCountryAmazoniaBoundaryOptions("ECU").enabled).toBe(true);
    expect(getCountryAmazoniaBoundaryOptions("XXX").enabled).toBe(false);
  });
});

describe("useGetCountryAmazoniaBoundary", () => {
  it("resolves the cached boundary for a live iso3", async () => {
    getFeaturesMock
      .mockResolvedValueOnce({ features: [{ geometry: COUNTRY_GEOMETRY }] } as never)
      .mockResolvedValueOnce({ features: [{ geometry: AMAZONIA_GEOMETRY }] } as never);
    intersectionExecute.mockReturnValue(BOUNDARY_GEOMETRY);

    const { result } = renderHook(() => useGetCountryAmazoniaBoundary("ECU"), {
      wrapper: getWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toBe(BOUNDARY_GEOMETRY);
  });

  it("never fetches for an iso3 that is not a known country", () => {
    const { result } = renderHook(() => useGetCountryAmazoniaBoundary("XXX"), {
      wrapper: getWrapper(),
    });

    expect(result.current.fetchStatus).toBe("idle");
    expect(getFeaturesMock).not.toHaveBeenCalled();
  });
});

describe("getLiveCountryBoundaries", () => {
  const ECU_SECOND = { ...ECU_MODULE, id: "ecu-2", slug: "ECU-NORTH" };
  const BOL_MODULE = { ...ECU_MODULE, id: "bol", slug: "BOL", country: "BOL" as const };

  it("resolves nothing without modules and skips the fetch", async () => {
    await expect(getLiveCountryBoundaries([])).resolves.toEqual([]);
    expect(getFeaturesMock).not.toHaveBeenCalled();
  });

  it("queries each distinct country once and shares its boundary between modules of that country", async () => {
    getFeaturesMock
      .mockResolvedValueOnce({
        features: [
          { attributes: { GID_0: "ECU" }, geometry: COUNTRY_GEOMETRY },
          { attributes: { GID_0: "BOL" }, geometry: COUNTRY_GEOMETRY },
        ],
      } as never)
      .mockResolvedValueOnce({ features: [{ geometry: AMAZONIA_GEOMETRY }] } as never);
    intersectionExecute.mockReturnValue(BOUNDARY_GEOMETRY);

    const result = await getLiveCountryBoundaries([ECU_MODULE, ECU_SECOND, BOL_MODULE]);

    expect(result).toEqual([
      { slug: "ECU", country: "ECU", geometry: BOUNDARY_GEOMETRY },
      { slug: "ECU-NORTH", country: "ECU", geometry: BOUNDARY_GEOMETRY },
      { slug: "BOL", country: "BOL", geometry: BOUNDARY_GEOMETRY },
    ]);
    expect(JSON.stringify(getFeaturesMock.mock.calls[0])).toContain("GID_0 IN ('ECU', 'BOL')");
  });

  it("drops countries with no feature, no geometry or no overlap, and resolves nothing without the working area", async () => {
    getFeaturesMock
      .mockResolvedValueOnce({
        features: [
          { attributes: { GID_0: "ECU" }, geometry: COUNTRY_GEOMETRY },
          { attributes: { GID_0: "BOL" }, geometry: null },
        ],
      } as never)
      .mockResolvedValueOnce({ features: [{ geometry: AMAZONIA_GEOMETRY }] } as never);
    intersectionExecute.mockReturnValue(null);

    await expect(getLiveCountryBoundaries([ECU_MODULE, BOL_MODULE])).resolves.toEqual([]);

    getFeaturesMock
      .mockResolvedValueOnce({ features: [] } as never)
      .mockResolvedValueOnce({ features: [] } as never);

    await expect(getLiveCountryBoundaries([ECU_MODULE])).resolves.toEqual([]);
  });
});

describe("getCountryCoverageRatio", () => {
  it("returns 1 for a geometry wholly inside the module boundary", () => {
    geodeticAreaExecute.mockReturnValueOnce(100).mockReturnValueOnce(100);
    intersectionExecute.mockReturnValue(DRAWN_GEOMETRY);

    expect(getCountryCoverageRatio(DRAWN_GEOMETRY, BOUNDARY_GEOMETRY)).toBe(1);
  });

  it("returns 0 for a geometry wholly outside the module boundary", () => {
    geodeticAreaExecute.mockReturnValueOnce(100);
    intersectionExecute.mockReturnValue(null);

    expect(getCountryCoverageRatio(DRAWN_GEOMETRY, BOUNDARY_GEOMETRY)).toBe(0);
  });

  it("returns the fraction on its own area for a geometry half in, half out", () => {
    geodeticAreaExecute.mockReturnValueOnce(100).mockReturnValueOnce(50);
    intersectionExecute.mockReturnValue(DRAWN_GEOMETRY);

    const ratio = getCountryCoverageRatio(DRAWN_GEOMETRY, BOUNDARY_GEOMETRY);

    expect(ratio).toBe(0.5);
    expect(isCountryCoverageDominant(ratio)).toBe(false);
  });

  it("returns 0, not NaN, for a zero-area geometry", () => {
    geodeticAreaExecute.mockReturnValueOnce(0);

    expect(getCountryCoverageRatio(DRAWN_GEOMETRY, BOUNDARY_GEOMETRY)).toBe(0);
    expect(intersectionExecute).not.toHaveBeenCalled();
  });

  it("returns 0 when either geometry is missing", () => {
    expect(getCountryCoverageRatio(null, BOUNDARY_GEOMETRY)).toBe(0);
    expect(getCountryCoverageRatio(DRAWN_GEOMETRY, null)).toBe(0);
    expect(geodeticAreaExecute).not.toHaveBeenCalled();
  });
});

describe("getCountryCoveragePercent", () => {
  it("rounds the ratio to the nearest whole percent", () => {
    expect(getCountryCoveragePercent(0.5)).toBe(50);
    expect(getCountryCoveragePercent(0.128)).toBe(13);
    expect(getCountryCoveragePercent(1)).toBe(100);
    expect(getCountryCoveragePercent(0)).toBe(0);
  });
});

describe("isCountryCoverageDominant", () => {
  it("does not switch at exactly 50%", () => {
    expect(isCountryCoverageDominant(0.5)).toBe(false);
  });

  it("switches once coverage exceeds 50%", () => {
    expect(isCountryCoverageDominant(0.51)).toBe(true);
  });

  it("does not switch below 50%", () => {
    expect(isCountryCoverageDominant(0.49)).toBe(false);
  });
});
