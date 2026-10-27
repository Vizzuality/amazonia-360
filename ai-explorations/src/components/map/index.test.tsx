import { render } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { MapView } from "@/components/map";

const mocks = vi.hoisted(() => ({
  viewProperties: [] as Record<string, unknown>[],
}));

vi.mock("@arcgis/core/views/MapView", () => ({
  default: class MapViewStub {
    ui = { add: vi.fn() };
    constructor(properties: Record<string, unknown>) {
      mocks.viewProperties.push(properties);
    }
    on() {}
    when() {}
  },
}));

vi.mock("@arcgis/core/Map", () => ({ default: class MapStub {} }));
vi.mock("@arcgis/core/Basemap", () => ({ default: { fromId: vi.fn() } }));
vi.mock("@arcgis/core/Color", () => ({ default: class ColorStub {} }));
vi.mock("@arcgis/core/geometry/Extent", () => ({ default: class ExtentStub {} }));
vi.mock("@arcgis/core/layers/GraphicsLayer", () => ({ default: class GraphicsLayerStub {} }));
vi.mock("@arcgis/core/core/reactiveUtils", () => ({
  when: vi.fn(),
  whenOnce: vi.fn(() => new Promise(() => {})),
}));
vi.mock("@arcgis/core/symbols/SimpleFillSymbol", () => ({ default: class {} }));
vi.mock("@arcgis/core/symbols/SimpleLineSymbol", () => ({ default: class {} }));
vi.mock("@arcgis/core/symbols/SimpleMarkerSymbol", () => ({ default: class {} }));
vi.mock("@/lib/webshot", () => ({
  registerMapForExport: vi.fn(),
  unregisterMapForExport: vi.fn(),
}));

describe("MapView", () => {
  beforeEach(() => {
    mocks.viewProperties = [];
  });

  it("disables rotation so the map stays north-up", () => {
    render(<MapView id="test" isPdf />);

    expect(mocks.viewProperties[0]).toMatchObject({
      constraints: { rotationEnabled: false },
    });
  });

  it("keeps rotation disabled when a map overrides the navigation", () => {
    render(
      <MapView id="test" isPdf viewProps={{ navigation: { actionMap: { mouseWheel: "none" } } }} />,
    );

    expect(mocks.viewProperties[0]).toMatchObject({
      constraints: { minZoom: 3, rotationEnabled: false },
      navigation: { actionMap: { mouseWheel: "none" } },
    });
  });
});
