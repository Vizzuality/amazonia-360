import { describe, expect, it } from "vitest";

import {
  describeAppliedFixes,
  fixVisualizationTypes,
  INDICATOR_ADDS_CHART,
  INDICATOR_DROPS_RASTER_FUNCTION,
  resolveFixedIndicatorId,
  SUBTOPIC_DEFAULT_VIS_FIX,
} from "./fixes";
import { rawIndicators, rawSubtopics } from "./source";

describe("fix 1: subtopic 26 -> deleted indicator 55", () => {
  it("repoints only subtopic 26's reference to 55", () => {
    expect(resolveFixedIndicatorId(26, 55)).toBe(146);
  });

  it("leaves every other owner and indicator untouched", () => {
    expect(resolveFixedIndicatorId(26, 146)).toBe(146);
    expect(resolveFixedIndicatorId(27, 55)).toBe(55);
    expect(resolveFixedIndicatorId(1, 3)).toBe(3);
  });

  it("targets a row that really is dangling, and a replacement that really exists", () => {
    const ids = new Set(rawIndicators.map((i) => i.id));
    expect(ids.has(SUBTOPIC_DEFAULT_VIS_FIX.from)).toBe(false);
    expect(ids.has(SUBTOPIC_DEFAULT_VIS_FIX.to)).toBe(true);

    const owner = rawSubtopics.find((s) => s.id === SUBTOPIC_DEFAULT_VIS_FIX.owner);
    expect(owner?.default_visualization).toHaveLength(1);
    expect(owner?.default_visualization?.[0].indicator_id).toBe(SUBTOPIC_DEFAULT_VIS_FIX.from);
  });
});

describe("fix 2: indicator 5 gains chart", () => {
  it("appends chart exactly once and preserves order", () => {
    expect(fixVisualizationTypes(INDICATOR_ADDS_CHART, ["map", "numeric"])).toEqual([
      "map",
      "numeric",
      "chart",
    ]);
    expect(fixVisualizationTypes(INDICATOR_ADDS_CHART, ["map", "chart"])).toEqual(["map", "chart"]);
  });

  it("changes no other indicator", () => {
    expect(fixVisualizationTypes(6, ["map", "numeric"])).toEqual(["map", "numeric"]);
    expect(fixVisualizationTypes(12, [])).toEqual([]);
  });

  it("targets a row that really has a query_chart it does not declare", () => {
    const row = rawIndicators.find((i) => i.id === INDICATOR_ADDS_CHART);
    expect(row?.resource.query_chart).toBeTruthy();
    expect(row?.visualization_types).not.toContain("chart");
  });
});

describe("fix 3: indicator 12 drops rasterFunction", () => {
  it("targets a feature row that really carries a bare-string rasterFunction", () => {
    const row = rawIndicators.find((i) => i.id === INDICATOR_DROPS_RASTER_FUNCTION);
    expect(row?.resource.type).toBe("feature");
    expect(row?.resource.rasterFunction).toBe("Forest_Cover_Change");
  });

  it("is the only feature row carrying one", () => {
    const offenders = rawIndicators.filter(
      (i) => i.resource.type === "feature" && Boolean(i.resource.rasterFunction),
    );
    expect(offenders.map((i) => i.id)).toEqual([INDICATOR_DROPS_RASTER_FUNCTION]);
  });
});

describe("describeAppliedFixes", () => {
  it("reports exactly the three named fixes against the real source", () => {
    expect(describeAppliedFixes()).toEqual([
      {
        collection: "subtopics",
        legacy_id: 26,
        change: "default_visualization indicator 55 -> 146",
      },
      { collection: "indicators", legacy_id: 5, change: "visualization_types += chart" },
      { collection: "indicators", legacy_id: 12, change: "dropped resource.rasterFunction" },
    ]);
  });
});
