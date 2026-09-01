import { isRangeLegend } from "@/lib/imagery";

import INDICATORS from "@/../datum/indicators.json";

type SourceIndicator = {
  id: number;
  name_en: string;
  visualization_types: string[];
  resource: {
    type: string;
    aggregation?: string;
    legend?: { items?: { label?: string | null }[] };
  };
};

const imagery = (INDICATORS as unknown as SourceIndicator[]).filter(
  (indicator) => indicator.resource.type === "imagery",
);

const describeIndicator = (indicator: SourceIndicator) =>
  `${indicator.id} (${indicator.name_en.trim()})`;

const isCategorical = (indicator: SourceIndicator) =>
  !isRangeLegend((indicator.resource.legend?.items ?? []).map((item) => item.label ?? ""));

describe("imagery aggregation", () => {
  test("the source data still has imagery indicators to check", () => {
    expect(imagery).toHaveLength(27);
  });

  test("pins the legend split the aggregation rules are derived from", () => {
    // Whether a legend is RANGE or CATEG is read off its labels, not authored. Pinning the split
    // means an edited label that silently reclassifies an indicator fails here rather than
    // quietly letting a class-code raster be summed.
    const categorical = imagery.filter(isCategorical).map((indicator) => indicator.id);

    expect(categorical).toEqual([7, 13, 119, 14, 129, 128, 163, 165]);
    expect(imagery.length - categorical.length).toBe(19);
  });

  test("every imagery indicator declares an aggregation", () => {
    const missing = imagery
      .filter(
        (indicator) => !["sum", "mean", "none"].includes(indicator.resource.aggregation ?? ""),
      )
      .map(
        (indicator) =>
          `${describeIndicator(indicator)}: aggregation is ${JSON.stringify(indicator.resource.aggregation)}`,
      );

    expect(missing).toEqual([]);
  });

  test("a numeric-capable imagery indicator aggregates with sum", () => {
    // The narrative and the numeric card read the same raster. Anything but `sum` there would
    // print a different figure from the card on the facing page.
    const violations = imagery
      .filter((indicator) => indicator.visualization_types.includes("numeric"))
      .filter((indicator) => indicator.resource.aggregation !== "sum")
      .map(
        (indicator) =>
          `${describeIndicator(indicator)}: offers a numeric widget but aggregates with ${indicator.resource.aggregation}`,
      );

    expect(violations).toEqual([]);
  });

  test("a categorical imagery indicator has no scalar", () => {
    const violations = imagery
      .filter(isCategorical)
      .filter((indicator) => indicator.resource.aggregation !== "none")
      .map(
        (indicator) =>
          `${describeIndicator(indicator)}: has a categorical legend but aggregates with ${indicator.resource.aggregation}`,
      );

    expect(violations).toEqual([]);
  });
});
