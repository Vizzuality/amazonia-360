import { ResourceImagery } from "@/types/indicator";

import {
  classDistribution,
  hasImageryCoverage,
  imageryScalar,
  isRangeLegend,
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
  test("reads the interior breaks off a population legend", () => {
    expect(parseLegendBreaks(["< 5", "5 - 50", "50 - 200", "200 - 1000", "> 1000"])).toEqual([
      5, 50, 200, 1000,
    ]);
  });

  test("keeps decimal breaks", () => {
    expect(
      parseLegendBreaks([
        "< 1.31",
        "1.31 - 10",
        "10 - 50",
        "50 - 70",
        "70 - 100",
        "100 - 290",
        "> 290",
      ]),
    ).toEqual([1.31, 10, 50, 70, 100, 290]);
  });

  test("rejects a categorical legend", () => {
    expect(parseLegendBreaks(["Tree Cover", "Shrubland", "Grassland"])).toBeNull();
    expect(parseLegendBreaks(["Very Low", "Low", "Average", "Good", "Very good"])).toBeNull();
  });

  test("rejects labels whose numbers do not line up as breaks", () => {
    // A categorical legend that happens to mention numbers: the count check is what catches it.
    expect(parseLegendBreaks(["Zone 1", "Zone 2", "Zone 3"])).toBeNull();
  });

  test("isRangeLegend agrees with the parse", () => {
    expect(isRangeLegend(["< 10", "10 - 25", "> 25"])).toBe(true);
    expect(isRangeLegend(["Cultivated", "Natural", "Open"])).toBe(false);
  });
});

describe("classDistribution", () => {
  test("buckets a continuous histogram onto a RANGE legend's breaks", () => {
    // 4 bins of width 250 over [0, 1000): centres 125, 375, 625, 875 against breaks 200 and 600.
    const distribution = classDistribution({
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
    const distribution = classDistribution({
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
      classDistribution({
        histograms: [histogram(1, 3, [0, 0, 0])],
        legend: legendOf(["A", "B", "C"]),
        rasterFunction: colormapOf([1, 2, 3]),
      }),
    ).toEqual([]);
  });

  test("counts each bin once when a coarse histogram lumps two class values together", () => {
    // 3 bins over [10, 100]: centres 25, 55, 85. Classes 90/95/100 all sit in the last bin, so a
    // per-class lookup would have counted it three times and pushed the total past 100%.
    const distribution = classDistribution({
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

  test("keeps the shares summing to 100 for a class-per-bin categorical raster", () => {
    const distribution = classDistribution({
      histograms: [
        histogram(
          10,
          100,
          new Array(91).fill(0).map((_, i) => (i % 10 === 0 ? 10 : 0)),
        ),
      ],
      legend: legendOf(["A", "B", "C", "D", "E", "F", "G", "H", "I", "J"]),
      rasterFunction: colormapOf([10, 20, 30, 40, 50, 60, 70, 80, 90, 100]),
    });

    const total = (distribution ?? []).reduce((sum, share) => sum + share.percentage, 0);
    expect(total).toBeCloseTo(100, 1);
  });

  test("returns null when a CATEG legend and its colormap disagree on length", () => {
    expect(
      classDistribution({
        histograms: [histogram(1, 3, [1, 1, 1])],
        legend: legendOf(["A", "B", "C"]),
        rasterFunction: colormapOf([1, 2]),
      }),
    ).toBeNull();
  });

  test("returns null without a histogram", () => {
    expect(
      classDistribution({
        histograms: [],
        legend: legendOf(["A", "B"]),
        rasterFunction: colormapOf([1, 2]),
      }),
    ).toBeNull();
  });
});

describe("imageryScalar", () => {
  const data = {
    histograms: [histogram(0, 10, [2, 2, 2, 2, 2])],
    statistics: [{ min: 0, max: 10, avg: 4.2, sum: 1234 }],
  };

  test("prefers the sum the service reports", () => {
    expect(imageryScalar(data, "sum")).toBe(1234);
  });

  test("falls back to the histogram when the service reports no sum", () => {
    const withoutSum = { ...data, statistics: [{ min: 0, max: 10 }] };

    // Same weighting as the numeric widget: min + index * max / (size - 1).
    expect(imageryScalar(withoutSum, "sum")).toBe(2 * (0 + 2.5 + 5 + 7.5 + 10));
  });

  test("reads the average for mean", () => {
    expect(imageryScalar(data, "mean")).toBe(4.2);
  });

  test("returns null for mean when the service reports no average", () => {
    expect(imageryScalar({ ...data, statistics: [{ min: 0, max: 10 }] }, "mean")).toBeNull();
  });

  test("returns no scalar for a categorical raster", () => {
    expect(imageryScalar(data, "none")).toBeNull();
  });

  test("returns no scalar rather than a silent sum when the aggregation is missing", () => {
    // A CMS-authored indicator with no aggregation must read as "not measured", never as a total.
    expect(imageryScalar(data, undefined as never)).toBeNull();
  });

  test("returns null with nothing to read", () => {
    expect(imageryScalar(null, "sum")).toBeNull();
    expect(imageryScalar({ histograms: [], statistics: [] }, "sum")).toBeNull();
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
