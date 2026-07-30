import * as geometryEngineAsync from "@arcgis/core/geometry/geometryEngineAsync";

// location.ts pulls in these hook modules; stub them so importActual doesn't run their
// module-level side effects (search.ts builds a SearchViewModel on import).
vi.mock("@/lib/search", () => ({ useGetSearch: vi.fn() }));
vi.mock("@/lib/query", () => ({ useGetFeatures: vi.fn() }));

// `@/lib/location` is globally mocked in vitest.setup.ts; we want the real implementation here.
const { getGeometryWithBuffer } =
  await vi.importActual<typeof import("@/lib/location")>("@/lib/location");

const geodesicBufferAsync = vi.mocked(geometryEngineAsync.geodesicBuffer);

describe("getGeometryWithBuffer", () => {
  // Regression: uploading a long polyline (e.g. the ~887 km BR-319) froze the app
  // because geodesicBuffer ran synchronously on the main thread. The buffer must run
  // off-thread via geometryEngineAsync so the UI stays responsive.
  it("buffers a polyline off the main thread via geometryEngineAsync", async () => {
    const buffered = { type: "polygon", rings: [[]] } as unknown as __esri.Polygon;
    geodesicBufferAsync.mockResolvedValue(buffered);

    const polyline = { type: "polyline" } as unknown as __esri.GeometryUnion;
    const result = getGeometryWithBuffer(polyline, 30);

    expect(result).toBeInstanceOf(Promise);
    await expect(result).resolves.toBe(buffered);
    expect(geodesicBufferAsync).toHaveBeenCalledWith(polyline, 30, "kilometers");
  });

  it("buffers a point off the main thread via geometryEngineAsync", async () => {
    const buffered = { type: "polygon", rings: [[]] } as unknown as __esri.Polygon;
    geodesicBufferAsync.mockResolvedValue(buffered);

    const point = { type: "point" } as unknown as __esri.GeometryUnion;
    await expect(getGeometryWithBuffer(point, 30)).resolves.toBe(buffered);
    expect(geodesicBufferAsync).toHaveBeenCalledWith(point, 30, "kilometers");
  });

  it("returns a polygon unchanged without buffering", async () => {
    const polygon = { type: "polygon" } as __esri.Polygon;
    await expect(getGeometryWithBuffer(polygon, 30)).resolves.toBe(polygon);
    expect(geodesicBufferAsync).not.toHaveBeenCalled();
  });

  it("resolves null for missing geometry", async () => {
    await expect(getGeometryWithBuffer(null, 30)).resolves.toBeNull();
  });
});
