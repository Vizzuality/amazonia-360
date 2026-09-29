import { DATASETS } from "@/constants/datasets";

import { getAreaAfpLayer } from "./area-afp-layer";

describe("getAreaAfpLayer", () => {
  it("keeps the solid dataset layer on the regional path", () => {
    expect(getAreaAfpLayer(null)).toBe(DATASETS.area_afp.layer);
  });

  it("draws a lighter dotted outline with its own id in a module, reusing the dataset url", () => {
    const layer = getAreaAfpLayer("ECU") as unknown as {
      id: string;
      url: string;
      renderer: { symbol: { color: number[]; outline: Record<string, unknown> } };
    };

    expect(layer.id).toBe("area_afp-module");
    expect(layer.url).toBe(DATASETS.area_afp.layer.url);
    expect(layer.renderer.symbol.color).toEqual([0, 0, 0, 0]);
    expect(layer.renderer.symbol.outline).toEqual({
      style: "dot",
      width: 1.5,
      color: [0, 78, 112, 0.45],
    });
  });

  it("leaves the dataset layer untouched", () => {
    getAreaAfpLayer("ECU");

    expect(DATASETS.area_afp.layer.id).toBe("area_afp");
  });
});
