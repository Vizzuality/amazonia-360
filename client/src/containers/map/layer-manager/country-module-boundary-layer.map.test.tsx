import { render } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import Layer from "@/components/map/layers";

import { getAreaAfpLayer } from "./area-afp-layer";
import CountryModuleBoundaryLayer from "./country-module-boundary-layer";

type FakeLayer = { id: string };

const mocks = vi.hoisted(() => ({
  country: "ECU" as string | null,
  layers: [] as FakeLayer[],
  reorder: vi.fn(),
}));

const fakeMap = {
  add: vi.fn((layer: FakeLayer) => {
    mocks.layers.push(layer);
  }),
  reorder: (layer: FakeLayer, index: number) => mocks.reorder(layer.id, index),
  findLayerById: (id: string) => mocks.layers.find((layer) => layer.id === id),
  remove: vi.fn((layer: FakeLayer) => {
    mocks.layers = mocks.layers.filter((entry) => entry !== layer);
  }),
};

vi.mock("next/dynamic", async () => {
  const { default: Layer } = await import("@/components/map/layers");
  return { default: () => Layer };
});

vi.mock("@arcgis/core/layers/GraphicsLayer", () => ({
  default: class GraphicsLayerStub {
    type = "graphics";
    id: string;
    graphics: unknown[] = [];
    constructor(properties: { id: string }) {
      this.id = properties.id;
    }
    removeAll() {
      this.graphics = [];
    }
    add(graphic: unknown) {
      this.graphics.push(graphic);
    }
  },
}));

vi.mock("@/components/map/provider", () => ({
  useMap: () => ({ map: fakeMap }),
}));

vi.mock("@/i18n/use-country", () => ({ useCountry: () => mocks.country }));

vi.mock("@/lib/country/coverage", () => ({
  useGetCountryAmazoniaBoundary: () => ({ data: { type: "polygon" } }),
}));

const getBoundaryLayers = () =>
  mocks.layers.filter((layer) => layer.id === "country-module-boundary");
const getLastReorderIndex = () => mocks.reorder.mock.calls.at(-1)?.[1];

describe("CountryModuleBoundaryLayer on a map", () => {
  beforeEach(() => {
    mocks.country = "ECU";
    mocks.layers = [];
    mocks.reorder.mockClear();
  });

  it("keeps exactly one layer across enter, exit and enter", async () => {
    const { rerender } = render(<CountryModuleBoundaryLayer index={1} />);
    await vi.waitFor(() => expect(getBoundaryLayers()).toHaveLength(1));

    mocks.country = null;
    rerender(<CountryModuleBoundaryLayer index={1} />);
    await vi.waitFor(() => expect(getBoundaryLayers()).toHaveLength(0));

    mocks.country = "ECU";
    rerender(<CountryModuleBoundaryLayer index={1} />);
    await vi.waitFor(() => expect(getBoundaryLayers()).toHaveLength(1));
  });

  it("follows the index it is given as indicators change", async () => {
    const { rerender } = render(<CountryModuleBoundaryLayer index={1} />);
    await vi.waitFor(() => expect(getLastReorderIndex()).toBe(1));

    rerender(<CountryModuleBoundaryLayer index={3} />);
    await vi.waitFor(() => expect(getLastReorderIndex()).toBe(3));

    rerender(<CountryModuleBoundaryLayer index={2} />);
    await vi.waitFor(() => expect(getLastReorderIndex()).toBe(2));
  });

  it("swaps the outline layer instead of stacking it across enter, exit and enter", async () => {
    const getAreaLayerIds = () =>
      mocks.layers.map((layer) => layer.id).filter((id) => id.startsWith("area_afp"));

    const { rerender } = render(<Layer index={0} layer={getAreaAfpLayer(null)} />);
    await vi.waitFor(() => expect(getAreaLayerIds()).toEqual(["area_afp"]));

    rerender(<Layer index={0} layer={getAreaAfpLayer("ECU")} />);
    await vi.waitFor(() => expect(getAreaLayerIds()).toEqual(["area_afp-module"]));

    rerender(<Layer index={0} layer={getAreaAfpLayer(null)} />);
    await vi.waitFor(() => expect(getAreaLayerIds()).toEqual(["area_afp"]));
    expect(mocks.reorder).toHaveBeenLastCalledWith("area_afp", 0);
  });
});
