import Polygon from "@arcgis/core/geometry/Polygon";
import { UseQueryResult } from "@tanstack/react-query";

import { CustomLocation, SearchLocation } from "@/app/parsers";

import "@testing-library/jest-dom";

/****************
 * Node modules
 ****************/
jest.mock("query-string", () => ({
  parse: jest.fn(),
  stringify: jest.fn(),
}));

jest.mock("react-markdown", () => ({ children }: { children?: string }) => {
  return children;
});

/****************
 * ArcGIS JS API
 ****************/
jest.mock("@arcgis/core/Map", () => class Map {});
jest.mock("@arcgis/core/views/MapView", () => class MapView {});
jest.mock("@arcgis/core/widgets/Search/SearchViewModel", () => class SearchViewModel {});

// Layers
jest.mock("@arcgis/core/layers/FeatureLayer", () => class FeatureLayer {});
jest.mock("@arcgis/core/layers/WebTileLayer", () => class WebTileLayer {});
jest.mock("@arcgis/core/layers/GraphicsLayer", () => class GraphicsLayer {});
jest.mock("@arcgis/core/layers/VectorTileLayer", () => class VectorTileLayer {});
jest.mock("@arcgis/core/layers/GeoJSONLayer", () => class GeoJSONLayer {});
jest.mock("@arcgis/core/layers/MapImageLayer", () => class MapImageLayer {});
jest.mock("@arcgis/core/layers/ImageryTileLayer", () => class ImageryTileLayer {});

// Layer support
jest.mock("@arcgis/core/layers/support/FeatureFilter", () => class FeatureFilter {});
jest.mock(
  "@arcgis/core/layers/support/FeatureReductionCluster",
  () => class FeatureReductionCluster {},
);

// Popup
jest.mock("@arcgis/core/PopupTemplate", () => class PopupTemplate {});

jest.mock("@arcgis/core/geometry/Point", () => class Point {});
jest.mock(
  "@arcgis/core/geometry/Polygon",
  () =>
    class Polygon {
      static fromJSON() {
        return {};
      }
    },
);
jest.mock("@arcgis/core/geometry/Polyline", () => class Polyline {});
jest.mock("@arcgis/core/Graphic", () => class Graphic {});

// Utils, Query and Geometry
jest.mock("@arcgis/core/rest/support/Query", () => class Query {});
jest.mock("@arcgis/core/geometry/geometryEngine", () => class geometryEngine {});
jest.mock("@arcgis/core/geometry/geometryEngineAsync", () => class geometryEngineAsync {});
jest.mock("@arcgis/core/geometry/projection", () => class geometryEngineAsync {});

// Renderers
jest.mock("@arcgis/core/renderers/SimpleRenderer", () => class SimpleRenderer {});
jest.mock("@arcgis/core/renderers/UniqueValueRenderer", () => class UniqueValueRenderer {});

// Symbols
jest.mock("@arcgis/core/symbols/SimpleFillSymbol", () => class SimpleFillSymbol {});
jest.mock("@arcgis/core/symbols/SimpleLineSymbol", () => class SimpleLineSymbol {});
jest.mock("@arcgis/core/symbols/SimpleMarkerSymbol", () => class SimpleMarkerSymbol {});
jest.mock("@arcgis/core/symbols/TextSymbol", () => class TextSymbol {});

/****************
 * STORE
 *********************/
export const mockUseSyncLocation = jest
  .fn<[SearchLocation | CustomLocation | null], unknown[]>()
  .mockReturnValue([
    {
      type: "polygon",
      geometry: {
        spatialReference: { wkid: 102100 },
        rings: [
          [
            [-7634755.5820374815, -339864.26614880934],
            [-7515666.691969208, -615171.3327748701],
            [-7937732.852902768, -672040.4818190257],
            [-8078033.018320172, -370362.6404345869],
            [-7634755.5820374815, -339864.26614880934],
          ],
        ],
      },
    },
  ]);

jest.mock("@/app/store", () => ({
  useSyncLocation() {
    return mockUseSyncLocation();
  },
}));

/****************
 * LOCATION
 ******************** */
export const mockUseLocationGeometry = jest.fn<Polygon | null, unknown[]>().mockReturnValue(
  Polygon.fromJSON({
    spatialReference: { wkid: 102100 },
    rings: [
      [
        [-7634755.5820374815, -339864.26614880934],
        [-7515666.691969208, -615171.3327748701],
        [-7937732.852902768, -672040.4818190257],
        [-8078033.018320172, -370362.6404345869],
        [-7634755.5820374815, -339864.26614880934],
      ],
    ],
  }),
);

jest.mock("@/lib/location", () => ({
  useLocationGeometry: jest.fn(),
}));

/****************
 * QUERY
 ******************** */
export const mockUseGetRasterAnalysis = jest
  .fn<Partial<UseQueryResult>, unknown[]>()
  .mockReturnValue({
    data: undefined,
    isFetching: false,
    isFetched: true,
  });
jest.mock("@/lib/query", () => ({
  useGetRasterAnalysis: mockUseGetRasterAnalysis,
}));
