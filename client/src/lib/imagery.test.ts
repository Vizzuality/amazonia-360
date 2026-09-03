import { ResourceImagery } from "@/types/indicator";

import INDICATORS from "@/../datum/indicators.json";

import {
  getClassDistribution,
  getImageryScalar,
  hasImageryCoverage,
  parseLegendBreaks,
} from "./imagery";

const histogram = (min: number, max: number, counts: number[]): __esri.RasterHistogram => ({
  min,
  max,
  size: counts.length,
  counts,
});

const legendOf = (labels: string[]): ResourceImagery["legend"] => ({
  type: "basic",
  items: labels.map((label, id) => ({ id, label, color: "#000000" })),
});

const colormapOf = (values: number[]) => ({
  functionName: "Colormap",
  functionArguments: { colormap: values.map((value) => [value, 0, 0, 0]), raster: "$$" },
});

describe("parseLegendBreaks", () => {
  test("reads the interior breaks off a population legend, decimals included", () => {
    expect(parseLegendBreaks(["< 1.31", "1.31 - 50", "50 - 200", "200 - 1000", "> 1000"])).toEqual([
      1.31, 50, 200, 1000,
    ]);
  });

  test("rejects a categorical legend", () => {
    expect(parseLegendBreaks(["Tree Cover", "Shrubland", "Grassland"])).toBeNull();
    expect(parseLegendBreaks(["Very Low", "Low", "Average", "Good", "Very good"])).toBeNull();
  });

  test("rejects labels whose numbers do not line up as breaks", () => {
    // A categorical legend that happens to mention numbers: the count check is what catches it.
    expect(parseLegendBreaks(["Zone 1", "Zone 2", "Zone 3"])).toBeNull();
  });
});

describe("getClassDistribution", () => {
  test("buckets a continuous histogram onto a RANGE legend's breaks", () => {
    // 4 bins of width 250 over [0, 1000): centres 125, 375, 625, 875 against breaks 200 and 600.
    const distribution = getClassDistribution({
      histograms: [histogram(0, 1000, [10, 30, 40, 20])],
      legend: legendOf(["< 200", "200 - 600", "> 600"]),
      rasterFunction: colormapOf([1, 2, 3]),
    });

    expect(distribution).toEqual([
      { label: "< 200", percentage: 10 },
      { label: "200 - 600", percentage: 30 },
      { label: "> 600", percentage: 60 },
    ]);
  });

  test("joins a CATEG legend to the histogram by colormap index", () => {
    const distribution = getClassDistribution({
      histograms: [histogram(1, 3, [60, 30, 10])],
      legend: legendOf(["Tree Cover", "Grassland", "Cropland"]),
      rasterFunction: colormapOf([1, 2, 3]),
    });

    expect(distribution).toEqual([
      { label: "Tree Cover", percentage: 60 },
      { label: "Grassland", percentage: 30 },
      { label: "Cropland", percentage: 10 },
    ]);
  });

  test("returns an empty distribution when the area holds no pixels", () => {
    expect(
      getClassDistribution({
        histograms: [histogram(1, 3, [0, 0, 0])],
        legend: legendOf(["A", "B", "C"]),
        rasterFunction: colormapOf([1, 2, 3]),
      }),
    ).toEqual([]);
  });

  test("counts each bin once when a coarse histogram lumps two class values together", () => {
    // 3 bins over [10, 100]: centres 25, 55, 85. Classes 90/95/100 all sit in the last bin, so a
    // per-class lookup would have counted it three times and pushed the total past 100%.
    const distribution = getClassDistribution({
      histograms: [histogram(10, 100, [40, 30, 30])],
      legend: legendOf(["Tree Cover", "Grassland", "Cropland", "Mangroves", "Moss"]),
      rasterFunction: colormapOf([10, 50, 90, 95, 100]),
    });

    expect(distribution).toEqual([
      { label: "Tree Cover", percentage: 40 },
      { label: "Grassland", percentage: 30 },
      { label: "Cropland", percentage: 30 },
      { label: "Mangroves", percentage: 0 },
      { label: "Moss", percentage: 0 },
    ]);
  });

  test("returns null when a CATEG legend and its colormap disagree on length", () => {
    expect(
      getClassDistribution({
        histograms: [histogram(1, 3, [1, 1, 1])],
        legend: legendOf(["A", "B", "C"]),
        rasterFunction: colormapOf([1, 2]),
      }),
    ).toBeNull();
  });

  test("returns null without a histogram", () => {
    expect(
      getClassDistribution({
        histograms: [],
        legend: legendOf(["A", "B"]),
        rasterFunction: colormapOf([1, 2]),
      }),
    ).toBeNull();
  });
});

describe("getImageryScalar", () => {
  const data = {
    histograms: [histogram(0, 10, [2, 2, 2, 2, 2])],
    statistics: [{ min: 0, max: 10, avg: 4.2, sum: 1234 }],
  };

  test("prefers the sum the service reports", () => {
    expect(getImageryScalar(data, "sum")).toBe(1234);
  });

  test("falls back to the histogram when the service reports no sum", () => {
    const withoutSum = { ...data, statistics: [{ min: 0, max: 10 }] };

    // Same weighting as the numeric widget: min + index * max / (size - 1).
    expect(getImageryScalar(withoutSum, "sum")).toBe(2 * (0 + 2.5 + 5 + 7.5 + 10));
  });

  test("reads the average for mean", () => {
    expect(getImageryScalar(data, "mean")).toBe(4.2);
  });

  test("returns null for mean when the service reports no average", () => {
    expect(getImageryScalar({ ...data, statistics: [{ min: 0, max: 10 }] }, "mean")).toBeNull();
  });

  test("returns no scalar for a categorical raster", () => {
    expect(getImageryScalar(data, "none")).toBeNull();
  });

  test("returns null with nothing to read", () => {
    expect(getImageryScalar(null, "sum")).toBeNull();
    expect(getImageryScalar({ histograms: [], statistics: [] }, "sum")).toBeNull();
  });
});

describe("hasImageryCoverage", () => {
  test("is false when every bin is empty", () => {
    expect(hasImageryCoverage([histogram(0, 1, [0, 0])])).toBe(false);
    expect(hasImageryCoverage([])).toBe(false);
    expect(hasImageryCoverage(undefined)).toBe(false);
  });

  test("is true as soon as one bin has pixels", () => {
    expect(hasImageryCoverage([histogram(0, 1, [0, 3])])).toBe(true);
  });
});

describe("datum/indicators.json imagery aggregation", () => {
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

  const isCategorical = (indicator: SourceIndicator) =>
    parseLegendBreaks((indicator.resource.legend?.items ?? []).map((item) => item.label ?? "")) ===
    null;

  const describeAll = (indicators: SourceIndicator[], reason: (i: SourceIndicator) => string) =>
    indicators.map((i) => `${i.id} (${i.name_en.trim()}): ${reason(i)}`);

  test("every imagery indicator declares an aggregation", () => {
    const missing = imagery.filter(
      (i) => !["sum", "mean", "none"].includes(i.resource.aggregation ?? ""),
    );

    expect(
      describeAll(missing, (i) => `aggregation is ${JSON.stringify(i.resource.aggregation)}`),
    ).toEqual([]);
  });

  test("a numeric-capable imagery indicator aggregates with sum", () => {
    // The narrative and the numeric card read the same raster. Anything but `sum` there would
    // print a different figure from the card on the facing page.
    const violations = imagery
      .filter((i) => i.visualization_types.includes("numeric"))
      .filter((i) => i.resource.aggregation !== "sum");

    expect(
      describeAll(
        violations,
        (i) => `offers a numeric widget but aggregates with ${i.resource.aggregation}`,
      ),
    ).toEqual([]);
  });

  test("a legend is categorical exactly when the indicator has no scalar", () => {
    // Whether a legend is RANGE or CATEG is read off its labels, not authored, so an edited or
    // retranslated label can silently reclassify a raster. Tying it to the authored `aggregation`
    // in both directions is what makes that fail here instead of quietly mis-binning.
    const violations = imagery.filter(
      (i) => isCategorical(i) !== (i.resource.aggregation === "none"),
    );

    expect(
      describeAll(violations, (i) =>
        isCategorical(i)
          ? `has a categorical legend but aggregates with ${i.resource.aggregation}`
          : `has a range legend but aggregates with none`,
      ),
    ).toEqual([]);
  });
});
