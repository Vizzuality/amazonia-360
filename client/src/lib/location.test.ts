import * as geodesicBufferOperator from "@arcgis/core/geometry/operators/geodesicBufferOperator";

// location.ts pulls in these hook modules; stub them so importActual doesn't run their
// module-level side effects (search.ts builds a SearchViewModel on import).
vi.mock("@/lib/search", () => ({ useGetSearch: vi.fn() }));
vi.mock("@/lib/query", () => ({ useGetFeatures: vi.fn() }));

// `@/lib/location` is globally mocked in vitest.setup.ts; we want the real implementation here.
const { getGeometryWithBuffer } =
  await vi.importActual<typeof import("@/lib/location")>("@/lib/location");

const geodesicBufferExecute = vi.mocked(geodesicBufferOperator.execute);

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
