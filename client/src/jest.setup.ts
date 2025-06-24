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

jest.mock("next-intl", () => {
  return {
    useTranslations: jest.fn().mockReturnValue(() => "translated"),
  };
});

/****************
 * ArcGIS JS API
 ****************/
jest.mock("@arcgis/core/Map", () => {});

jest.mock("@arcgis/core/Basemap", () => {
  return class MockBasemap {
    constructor(properties?: Record<string, unknown>) {
      Object.assign(this, properties || {});
    }

    static fromId(id: string) {
      return new MockBasemap({ id });
    }
  };
});

jest.mock("@arcgis/core/views/MapView", () => {});

jest.mock("@arcgis/core/widgets/Search/SearchViewModel", () => {});

// Layers
jest.mock("@arcgis/core/layers/FeatureLayer", () => {
  return class MockFeatureLayer {
    constructor(properties?: Record<string, unknown>) {
      Object.assign(this, properties || {});
    }
  };
});

jest.mock("@arcgis/core/layers/WebTileLayer", () => {});

jest.mock("@arcgis/core/layers/GraphicsLayer", () => {
  // Define a mock Graphic type for better type safety if possible, or use unknown
  type MockGraphic = Record<string, unknown>; // Or more specific if known

  return class MockGraphicsLayer {
    graphics: MockGraphic[] = [];
    id: string;
    removeAll = jest.fn(() => {
      this.graphics = [];
    });
    add = jest.fn((graphic: MockGraphic) => {
      this.graphics.push(graphic);
    });
    remove = jest.fn((graphic: MockGraphic) => {
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
  };
});

jest.mock("@arcgis/core/layers/VectorTileLayer", () => {});

jest.mock("@arcgis/core/layers/GeoJSONLayer", () => {});

jest.mock("@arcgis/core/layers/MapImageLayer", () => {});

jest.mock("@arcgis/core/layers/ImageryTileLayer", () => {});

// Layer support
jest.mock("@arcgis/core/layers/support/FeatureFilter", () => {});

jest.mock("@arcgis/core/layers/support/FeatureReductionCluster", () => {});

// Popup
jest.mock("@arcgis/core/PopupTemplate", () => {});

// Geometry
jest.mock("@arcgis/core/geometry/Point", () => {
  return class MockPoint {
    constructor(properties?: Record<string, unknown>) {
      Object.assign(this, properties || {});
    }

    static fromJSON(json: Record<string, unknown>) {
      return new MockPoint(json);
    }
  };
});

jest.mock("@arcgis/core/geometry/Polygon", () => {
  return class MockPolygon {
    constructor(properties?: Record<string, unknown>) {
      Object.assign(this, properties || {});
    }

    static fromJSON(json: Record<string, unknown>) {
      return new MockPolygon(json);
    }
  };
});

jest.mock("@arcgis/core/geometry/Polyline", () => {});

jest.mock("@arcgis/core/Graphic", () => {
  return class MockGraphic {
    constructor(properties?: Record<string, unknown>) {
      Object.assign(this, properties || {});
    }
  };
});

// Utils, Query and Geometry
jest.mock("@arcgis/core/rest/support/Query", () => {
  return class MockQuery {
    constructor(properties?: Record<string, unknown>) {
      Object.assign(this, properties || {});
    }
  };
});

jest.mock("@arcgis/core/geometry/geometryEngine", () => ({
  geodesicBuffer: jest.fn(),
  geodesicArea: jest.fn(),
  intersect: jest.fn(),
  union: jest.fn(),
}));

jest.mock("@arcgis/core/geometry/geometryEngineAsync", () => ({
  intersect: jest.fn(),
  union: jest.fn(),
}));

jest.mock("@arcgis/core/geometry/projection", () => ({
  project: jest.fn(),
}));

// Renderers
jest.mock("@arcgis/core/renderers/SimpleRenderer", () => {
  return class MockSimpleRenderer {};
});

jest.mock("@arcgis/core/renderers/UniqueValueRenderer", () => {
  return class MockUniqueValueRenderer {};
});

// Symbols
jest.mock("@arcgis/core/symbols/SimpleFillSymbol", () => {
  return class MockSimpleFillSymbol {};
});

jest.mock("@arcgis/core/symbols/SimpleLineSymbol", () => {
  return class MockSimpleLineSymbol {};
});

jest.mock("@arcgis/core/symbols/SimpleMarkerSymbol", () => {
  return class MockSimpleMarkerSymbol {};
});

jest.mock("@arcgis/core/symbols/TextSymbol", () => {
  return class MockTextSymbol {};
});

// Core module (Color, etc.)
interface MockColorProperties {
  r?: number;
  g?: number;
  b?: number;
  a?: number;
}
jest.mock("@arcgis/core/Color", () => {
  return class MockColor {
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
  };
});

jest.mock("@arcgis/core/config", () => ({
  apiKey: "",
  request: {
    interceptors: [],
  },
}));

jest.mock("@arcgis/core/widgets/Fullscreen/FullscreenViewModel", () => {
  return class MockFullscreenViewModel {
    constructor(properties?: Record<string, unknown>) {
      Object.assign(this, properties || {});
    }

    toggle = jest.fn();
    enter = jest.fn();
    exit = jest.fn();
    destroy = jest.fn();
  };
});

jest.mock("@arcgis/core/widgets/Zoom/ZoomViewModel", () => {
  return class MockZoomViewModel {
    constructor(properties?: Record<string, unknown>) {
      Object.assign(this, properties || {});
    }

    zoomIn = jest.fn();
    zoomOut = jest.fn();
    destroy = jest.fn();
  };
});

jest.mock("@arcgis/core/widgets/Sketch/SketchViewModel", () => {
  return class MockSketchViewModel {
    constructor(properties?: Record<string, unknown>) {
      Object.assign(this, properties || {});
    }

    create = jest.fn();
    cancel = jest.fn();
    destroy = jest.fn();
    on = jest.fn().mockReturnValue({ remove: jest.fn() });
  };
});

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
      buffer: 0,
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
// Assuming __esri.PolygonProperties or a similar interface exists or can be defined
// For now, using a generic geometry properties type.
interface MockPolygonProperties {
  spatialReference?: { wkid?: number };
  rings?: number[][][];
  [key: string]: unknown;
}

export const mockUseLocationGeometry = jest
  .fn<MockPolygonProperties | null, unknown[]>()
  .mockReturnValue({
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

jest.mock("@/lib/location", () => ({
  useLocationGeometry: jest.fn(),
}));
