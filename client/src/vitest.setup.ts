import { vi } from "vitest";

import { CustomLocation, SearchLocation } from "@/app/(frontend)/parsers";

import "@testing-library/jest-dom/vitest";

/****************
 * Node modules
 ****************/
vi.mock("query-string", () => ({
  parse: vi.fn(),
  stringify: vi.fn(),
}));

vi.mock("rehype-raw", () => ({ default: vi.fn() }));

vi.mock("react-markdown", () => ({
  default: ({ children }: { children?: string }) => {
    return children;
  },
}));

vi.mock("next-intl", () => {
  return {
    useTranslations: vi.fn().mockReturnValue((key: string) => key),
    useLocale: vi.fn().mockReturnValue("en"),
  };
});

vi.mock("@/i18n/routing", () => ({
  locales: ["en", "es", "pt"],
  defaultLocale: "en",
}));

/****************
 * ArcGIS JS API
 ****************/
vi.mock("@arcgis/core/Map", () => ({ default: class MockMap {} }));

vi.mock("@arcgis/core/Basemap", () => ({
  default: class MockBasemap {
    constructor(properties?: Record<string, unknown>) {
      Object.assign(this, properties || {});
    }

    static fromId(id: string) {
      return new MockBasemap({ id });
    }
  },
}));

vi.mock("@arcgis/core/views/MapView", () => ({
  default: class MockMapView {},
}));

vi.mock("@arcgis/core/widgets/Search/SearchViewModel", () => ({
  default: class MockSearchViewModel {},
}));

// Layers
vi.mock("@arcgis/core/layers/FeatureLayer", () => ({
  default: class MockFeatureLayer {
    constructor(properties?: Record<string, unknown>) {
      Object.assign(this, properties || {});
    }
  },
}));

vi.mock("@arcgis/core/layers/WebTileLayer", () => ({
  default: class MockWebTileLayer {},
}));

vi.mock("@arcgis/core/layers/GraphicsLayer", () => {
  // Define a mock Graphic type for better type safety if possible, or use unknown
  type MockGraphic = Record<string, unknown>; // Or more specific if known

  return {
    default: class MockGraphicsLayer {
      graphics: MockGraphic[] = [];
      id: string;
      removeAll = vi.fn(() => {
        this.graphics = [];
      });
      add = vi.fn((graphic: MockGraphic) => {
        this.graphics.push(graphic);
      });
      remove = vi.fn((graphic: MockGraphic) => {
        const index = this.graphics.indexOf(graphic);
        if (index > -1) {
          return this.graphics.splice(index, 1)[0];
        }
        return null;
      });

      constructor(properties: Record<string, unknown> = {}) {
        Object.assign(this, properties || {});
        this.id = (properties.id as string) || "mock-graphics-layer";
      }
    },
  };
});

vi.mock("@arcgis/core/layers/VectorTileLayer", () => ({
  default: class MockVectorTileLayer {},
}));

vi.mock("@arcgis/core/layers/GeoJSONLayer", () => ({
  default: class MockGeoJSONLayer {},
}));

vi.mock("@arcgis/core/layers/MapImageLayer", () => ({
  default: class MockMapImageLayer {},
}));

vi.mock("@arcgis/core/layers/ImageryTileLayer", () => ({
  default: class MockImageryTileLayer {},
}));

// Layer support
vi.mock("@arcgis/core/layers/support/FeatureFilter", () => ({
  default: class MockFeatureFilter {},
}));

vi.mock("@arcgis/core/layers/support/FeatureReductionCluster", () => ({
  default: class MockFeatureReductionCluster {},
}));

// Popup
vi.mock("@arcgis/core/PopupTemplate", () => ({
  default: class MockPopupTemplate {},
}));

// Geometry
vi.mock("@arcgis/core/geometry/Point", () => ({
  default: class MockPoint {
    constructor(properties?: Record<string, unknown>) {
      Object.assign(this, properties || {});
    }

    static fromJSON(json: Record<string, unknown>) {
      return new MockPoint(json);
    }
  },
}));

vi.mock("@arcgis/core/geometry/Polygon", () => ({
  default: class MockPolygon {
    constructor(properties?: Record<string, unknown>) {
      Object.assign(this, properties || {});
    }

    static fromJSON(json: Record<string, unknown>) {
      return new MockPolygon(json);
    }
  },
}));

vi.mock("@arcgis/core/geometry/Polyline", () => ({
  default: class MockPolyline {},
}));

vi.mock("@arcgis/core/Graphic", () => ({
  default: class MockGraphic {
    constructor(properties?: Record<string, unknown>) {
      Object.assign(this, properties || {});
    }
  },
}));

// Utils, Query and Geometry
vi.mock("@arcgis/core/rest/support/Query", () => ({
  default: class MockQuery {
    constructor(properties?: Record<string, unknown>) {
      Object.assign(this, properties || {});
    }
  },
}));

vi.mock("@arcgis/core/geometry/operators/geodeticAreaOperator", () => ({
  execute: vi.fn(),
  load: vi.fn(),
  isLoaded: vi.fn(),
}));

vi.mock("@arcgis/core/geometry/operators/intersectionOperator", () => ({
  execute: vi.fn(),
  load: vi.fn(),
  isLoaded: vi.fn(),
}));

vi.mock("@arcgis/core/geometry/operators/intersectsOperator", () => ({
  execute: vi.fn(),
  load: vi.fn(),
  isLoaded: vi.fn(),
}));

vi.mock("@arcgis/core/geometry/projection", () => ({
  project: vi.fn(),
}));

// Renderers
vi.mock("@arcgis/core/renderers/SimpleRenderer", () => ({
  default: class MockSimpleRenderer {},
}));

vi.mock("@arcgis/core/renderers/UniqueValueRenderer", () => ({
  default: class MockUniqueValueRenderer {},
}));

// Symbols
vi.mock("@arcgis/core/symbols/SimpleFillSymbol", () => ({
  default: class MockSimpleFillSymbol {},
}));

vi.mock("@arcgis/core/symbols/SimpleLineSymbol", () => ({
  default: class MockSimpleLineSymbol {},
}));

vi.mock("@arcgis/core/symbols/SimpleMarkerSymbol", () => ({
  default: class MockSimpleMarkerSymbol {},
}));

vi.mock("@arcgis/core/symbols/TextSymbol", () => ({
  default: class MockTextSymbol {},
}));

// Core module (Color, etc.)
interface MockColorProperties {
  r?: number;
  g?: number;
  b?: number;
  a?: number;
}
vi.mock("@arcgis/core/Color", () => ({
  default: class MockColor {
    r: number = 255;
    g: number = 255;
    b: number = 255;
    a: number = 1;

    constructor(color?: string | number[] | MockColorProperties) {
      if (Array.isArray(color)) {
        this.r = color[0] || 255;
        this.g = color[1] || 255;
        this.b = color[2] || 255;
        this.a = color[3] !== undefined ? color[3] : 1;
      } else if (typeof color === "string") {
        if (color.startsWith("#")) {
          const hex = color.slice(1);
          if (hex.length === 6) {
            this.r = parseInt(hex.slice(0, 2), 16);
            this.g = parseInt(hex.slice(2, 4), 16);
            this.b = parseInt(hex.slice(4, 6), 16);
            this.a = 1;
          }
        }
      } else if (typeof color === "object" && color !== null) {
        this.r = color.r !== undefined ? color.r : 255;
        this.g = color.g !== undefined ? color.g : 255;
        this.b = color.b !== undefined ? color.b : 255;
        this.a = color.a !== undefined ? color.a : 1;
      }
    }

    static fromArray(arr: number[]) {
      return new MockColor(arr);
    }

    static fromHex(hex: string) {
      return new MockColor(hex);
    }

    toRgba(): [number, number, number, number] {
      return [this.r, this.g, this.b, this.a];
    }

    toHex(): string {
      const toHex = (n: number): string => Math.round(n).toString(16).padStart(2, "0");
      return `#${toHex(this.r)}${toHex(this.g)}${toHex(this.b)}`;
    }

    toString(): string {
      return `rgba(${this.r}, ${this.g}, ${this.b}, ${this.a})`;
    }
  },
}));

vi.mock("@arcgis/core/config", () => ({
  default: {
    apiKey: "",
    request: {
      interceptors: [],
    },
  },
}));

vi.mock("@arcgis/core/widgets/Fullscreen/FullscreenViewModel", () => ({
  default: class MockFullscreenViewModel {
    constructor(properties?: Record<string, unknown>) {
      Object.assign(this, properties || {});
    }

    toggle = vi.fn();
    enter = vi.fn();
    exit = vi.fn();
    destroy = vi.fn();
  },
}));

vi.mock("@arcgis/core/widgets/Zoom/ZoomViewModel", () => ({
  default: class MockZoomViewModel {
    constructor(properties?: Record<string, unknown>) {
      Object.assign(this, properties || {});
    }

    zoomIn = vi.fn();
    zoomOut = vi.fn();
    destroy = vi.fn();
  },
}));

vi.mock("@arcgis/core/widgets/Sketch/SketchViewModel", () => ({
  default: class MockSketchViewModel {
    constructor(properties?: Record<string, unknown>) {
      Object.assign(this, properties || {});
    }

    create = vi.fn();
    cancel = vi.fn();
    destroy = vi.fn();
    on = vi.fn().mockReturnValue({ remove: vi.fn() });
  },
}));

/****************
 * STORE
 *********************/
export const mockUseSyncLocation = vi
  .fn<() => [SearchLocation | CustomLocation | null]>()
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
      buffer: 0,
    },
  ]);

vi.mock("@/app/(frontend)/store", () => ({
  useSyncLocation() {
    return mockUseSyncLocation();
  },
}));

/****************
 * LOCATION
 ******************** */
// Assuming __esri.PolygonProperties or a similar interface exists or can be defined
// For now, using a generic geometry properties type.
interface MockPolygonProperties {
  spatialReference?: { wkid?: number };
  rings?: number[][][];
  [key: string]: unknown;
}

export const mockUseLocationGeometry = vi.fn<() => MockPolygonProperties | null>().mockReturnValue({
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
});

vi.mock("@/lib/location", () => ({
  useLocationGeometry: vi.fn(),
}));
