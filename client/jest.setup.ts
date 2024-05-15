import "@testing-library/jest-dom";

/****************
 * Node modules
 ****************/
jest.mock("query-string", () => ({
  parse: jest.fn(),
  stringify: jest.fn(),
}));

/****************
 * ArcGIS JS API
 ****************/
jest.mock("@arcgis/core/Map", () => class Map {});
jest.mock("@arcgis/core/views/MapView", () => class MapView {});

// Layers
jest.mock("@arcgis/core/layers/FeatureLayer", () => class FeatureLayer {});
jest.mock("@arcgis/core/layers/WebTileLayer", () => class WebTileLayer {});
jest.mock("@arcgis/core/layers/GraphicsLayer", () => class GraphicsLayer {});
jest.mock(
  "@arcgis/core/layers/VectorTileLayer",
  () => class VectorTileLayer {},
);
jest.mock("@arcgis/core/layers/GeoJSONLayer", () => class GeoJSONLayer {});

// Utils, Query and Geometry
jest.mock("@arcgis/core/rest/support/Query", () => class Query {});
jest.mock(
  "@arcgis/core/geometry/geometryEngine",
  () => class geometryEngine {},
);
jest.mock(
  "@arcgis/core/geometry/geometryEngineAsync",
  () => class geometryEngineAsync {},
);
jest.mock(
  "@arcgis/core/geometry/projection",
  () => class geometryEngineAsync {},
);

// Renderers
jest.mock(
  "@arcgis/core/renderers/SimpleRenderer",
  () => class SimpleRenderer {},
);
jest.mock(
  "@arcgis/core/renderers/UniqueValueRenderer",
  () => class UniqueValueRenderer {},
);

// Symbols
jest.mock(
  "@arcgis/core/symbols/SimpleFillSymbol",
  () => class SimpleFillSymbol {},
);
jest.mock(
  "@arcgis/core/symbols/SimpleLineSymbol",
  () => class SimpleLineSymbol {},
);
jest.mock(
  "@arcgis/core/symbols/SimpleMarkerSymbol",
  () => class SimpleMarkerSymbol {},
);
