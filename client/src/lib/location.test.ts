import * as geodesicBufferOperator from "@arcgis/core/geometry/operators/geodesicBufferOperator";
import * as projectOperator from "@arcgis/core/geometry/operators/projectOperator";
import { renderHook, waitFor } from "@testing-library/react";

import type { Location } from "@/app/(frontend)/parsers";

// location.ts pulls in these hook modules; stub them so importActual doesn't run their
// module-level side effects (search.ts builds a SearchViewModel on import).
vi.mock("@/lib/search", () => ({ useGetSearch: vi.fn(() => ({ data: undefined })) }));
vi.mock("@/lib/query", () => ({ useGetFeatures: vi.fn() }));

// `@/lib/location` is globally mocked in vitest.setup.ts; we want the real implementation here.
const { getGeometryWithBuffer, useLocationGeometryWithStatus } =
  await vi.importActual<typeof import("@/lib/location")>("@/lib/location");

const geodesicBufferExecute = vi.mocked(geodesicBufferOperator.execute);
const projectExecute = vi.mocked(projectOperator.execute);

describe("getGeometryWithBuffer", () => {
  it("resolves a buffered polygon for a polyline via geodesicBufferOperator", async () => {
    const buffered = { type: "polygon", rings: [[]] } as unknown as __esri.Polygon;
    geodesicBufferExecute.mockReturnValue(buffered);

    const polyline = { type: "polyline" } as unknown as __esri.GeometryUnion;
    const result = getGeometryWithBuffer(polyline, 30);

    expect(result).toBeInstanceOf(Promise);
    await expect(result).resolves.toBe(buffered);
    expect(geodesicBufferExecute).toHaveBeenCalledWith(polyline, 30, { unit: "kilometers" });
  });

  it("resolves a buffered polygon for a point via geodesicBufferOperator", async () => {
    const buffered = { type: "polygon", rings: [[]] } as unknown as __esri.Polygon;
    geodesicBufferExecute.mockReturnValue(buffered);

    const point = { type: "point" } as unknown as __esri.GeometryUnion;
    await expect(getGeometryWithBuffer(point, 30)).resolves.toBe(buffered);
    expect(geodesicBufferExecute).toHaveBeenCalledWith(point, 30, { unit: "kilometers" });
  });

  it("returns a polygon unchanged without buffering", async () => {
    const polygon = { type: "polygon" } as __esri.Polygon;
    await expect(getGeometryWithBuffer(polygon, 30)).resolves.toBe(polygon);
    expect(geodesicBufferExecute).not.toHaveBeenCalled();
  });

  it("resolves null for missing geometry", async () => {
    await expect(getGeometryWithBuffer(null, 30)).resolves.toBeNull();
  });
});

describe("useLocationGeometryWithStatus", () => {
  // The mocked Polygon copies its JSON onto the instance, so `toJSON` here is what the
  // buffer cache keys on. A unique id per location keeps cache hits out of the tests.
  const polygonLocation = (id: string): Location => ({
    type: "polygon",
    buffer: 0,
    geometry: { type: "polygon", toJSON: () => ({ id }) },
  });

  beforeEach(() => {
    projectExecute.mockImplementation(
      (geometry) =>
        ({ projected: (geometry as unknown as { toJSON: () => unknown }).toJSON() }) as never,
    );
  });

  it("is empty and idle without a location", () => {
    const { result } = renderHook(() => useLocationGeometryWithStatus(null, { wkid: 4326 }));

    expect(result.current).toEqual({ geometry: null, isCalculating: false });
  });

  it("reports calculating until the buffered geometry resolves", async () => {
    const location = polygonLocation("a");
    const { result } = renderHook(() => useLocationGeometryWithStatus(location, { wkid: 4326 }));

    expect(result.current).toEqual({ geometry: null, isCalculating: true });

    await waitFor(() => expect(result.current.isCalculating).toBe(false));
    expect(result.current.geometry).toEqual({ projected: { id: "a" } });
  });

  it("keeps the previous geometry while the next location is calculated", async () => {
    const { result, rerender } = renderHook(
      ({ location }) => useLocationGeometryWithStatus(location, { wkid: 4326 }),
      { initialProps: { location: polygonLocation("b") } },
    );
    await waitFor(() => expect(result.current.isCalculating).toBe(false));

    rerender({ location: polygonLocation("c") });

    expect(result.current).toEqual({ geometry: { projected: { id: "b" } }, isCalculating: true });

    await waitFor(() => expect(result.current.isCalculating).toBe(false));
    expect(result.current.geometry).toEqual({ projected: { id: "c" } });
  });

  it("drops the geometry once the location is cleared", async () => {
    const { result, rerender } = renderHook(
      ({ location }: { location: Location | null }) =>
        useLocationGeometryWithStatus(location, { wkid: 4326 }),
      { initialProps: { location: polygonLocation("d") as Location | null } },
    );
    await waitFor(() => expect(result.current.isCalculating).toBe(false));

    rerender({ location: null });

    expect(result.current).toEqual({ geometry: null, isCalculating: false });
  });
});
