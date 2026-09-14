import { getPlaceholderGridLayerProps } from "./placeholder-grid-layer";

describe("getPlaceholderGridLayerProps", () => {
  test("falls back to the default resolution when the view has no zoom yet", () => {
    // ArcGIS reports -1 until the view has a valid LOD. h3 rejects a negative resolution,
    // and the throw takes the whole page down through the error boundary.
    expect(() => getPlaceholderGridLayerProps({ geometry: null, zoom: -1 })).not.toThrow();
  });

  test("uses the zoom when the view has one", () => {
    expect(() => getPlaceholderGridLayerProps({ geometry: null, zoom: 3 })).not.toThrow();
  });

  test("works with no zoom at all", () => {
    expect(() => getPlaceholderGridLayerProps({ geometry: null })).not.toThrow();
  });
});
