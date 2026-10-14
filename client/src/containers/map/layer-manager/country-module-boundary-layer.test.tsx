import { render } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { COUNTRY_MODULE_BOUNDARY_SYMBOL } from "@/constants/map";

import CountryModuleBoundaryLayer from "./country-module-boundary-layer";

type LayerStub = {
  id: string;
  title: string;
  listMode: string;
  graphics: { geometry: unknown; symbol: unknown }[];
};

const mocks = vi.hoisted(() => ({
  country: null as string | null,
  iso3: "ECU",
  boundarySpy: vi.fn(),
  boundary: undefined as unknown,
  layerSpy: vi.fn(),
  unmountSpy: vi.fn(),
}));

vi.mock("next/dynamic", async () => {
  const { useEffect } = await import("react");
  return {
    default: () =>
      function LayerStub(props: { index: number; layer: LayerStub }) {
        mocks.layerSpy(props);
        useEffect(() => mocks.unmountSpy, []);
        return null;
      },
  };
});

vi.mock("@/lib/country-modules", () => ({
  useGetCountryModule: () => (mocks.country ? { slug: mocks.country, country: mocks.iso3 } : null),
}));

vi.mock("@/lib/country/coverage", () => ({
  useGetCountryAmazoniaBoundary: (iso3: string) => {
    mocks.boundarySpy(iso3);
    return { data: mocks.boundary };
  },
}));

const geometryA = { type: "polygon", id: "a" };
const geometryB = { type: "polygon", id: "b" };

const getLastLayerProps = () =>
  mocks.layerSpy.mock.calls.at(-1)![0] as {
    index: number;
    layer: LayerStub;
  };

describe("CountryModuleBoundaryLayer", () => {
  beforeEach(() => {
    mocks.country = "ECU";
    mocks.iso3 = "ECU";
    mocks.boundary = geometryA;
    mocks.boundarySpy.mockClear();
    mocks.layerSpy.mockClear();
    mocks.unmountSpy.mockClear();
  });

  it("renders nothing on the regional path", () => {
    mocks.country = null;
    render(<CountryModuleBoundaryLayer index={1} />);
    expect(mocks.layerSpy).not.toHaveBeenCalled();
  });

  it("fetches the boundary by the module country, not its slug", () => {
    mocks.country = "bra-para";
    mocks.iso3 = "BRA";

    render(<CountryModuleBoundaryLayer index={1} />);

    expect(mocks.boundarySpy).toHaveBeenCalledWith("BRA");
  });

  it("renders nothing while the boundary is unresolved", () => {
    mocks.boundary = undefined;
    render(<CountryModuleBoundaryLayer index={1} />);
    expect(mocks.layerSpy).not.toHaveBeenCalled();
  });

  it("renders nothing when the boundary is null", () => {
    mocks.boundary = null;
    render(<CountryModuleBoundaryLayer index={1} />);
    expect(mocks.layerSpy).not.toHaveBeenCalled();
  });

  it("draws the boundary as one non-interactive graphic with the module symbol", () => {
    render(<CountryModuleBoundaryLayer index={1} />);

    const { index, layer } = getLastLayerProps();
    expect(index).toBe(1);
    expect(layer).toMatchObject({
      id: "country-module-boundary",
      listMode: "hide",
    });
    expect(layer.graphics).toHaveLength(1);
    expect(layer.graphics[0]).toEqual({
      geometry: geometryA,
      symbol: COUNTRY_MODULE_BOUNDARY_SYMBOL,
    });
  });

  it("replaces the graphic on the same layer instance when the boundary changes", () => {
    const { rerender } = render(<CountryModuleBoundaryLayer index={1} />);
    const first = getLastLayerProps().layer;

    mocks.boundary = geometryB;
    rerender(<CountryModuleBoundaryLayer index={1} />);

    const second = getLastLayerProps().layer;
    expect(second).toBe(first);
    expect(second.graphics).toHaveLength(1);
    expect(second.graphics[0].geometry).toBe(geometryB);
  });

  it("unmounts the layer when leaving the module", () => {
    const { rerender } = render(<CountryModuleBoundaryLayer index={1} />);
    expect(mocks.unmountSpy).not.toHaveBeenCalled();

    mocks.country = null;
    rerender(<CountryModuleBoundaryLayer index={1} />);

    expect(mocks.unmountSpy).toHaveBeenCalledTimes(1);
  });

  it("does not stack graphics on re-entry", () => {
    const { rerender } = render(<CountryModuleBoundaryLayer index={1} />);
    mocks.country = null;
    rerender(<CountryModuleBoundaryLayer index={1} />);
    mocks.country = "ECU";
    rerender(<CountryModuleBoundaryLayer index={1} />);

    expect(getLastLayerProps().layer.graphics).toHaveLength(1);
  });
});
