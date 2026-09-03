import { roundTo } from "@/lib/utils";

import { ImageryAggregation, ResourceImagery } from "@/types/indicator";

export type ClassShare = {
  label: string;
  /**
   * Share of the pixels that carry data inside the analysis area, 0-100 — NoData is not counted
   * either way, so shares across a legend sum to 100.
   */
  percentage: number;
};

/**
 * Nothing in `datum/indicators.json` records whether a legend is RANGE or CATEG — every imagery
 * legend is `type: "basic"` — so it is read back off the labels: RANGE when every label carries a
 * number and the distinct numbers are exactly one fewer than the labels, i.e. the interior breaks.
 * That count check is what stops a categorical label mentioning a number from parsing.
 *
 * Authored bounds per legend item would delete this. Until then note `label` is localized, so a
 * decimal comma reads as two numbers and fails the count check.
 */
export const parseLegendBreaks = (labels: string[]): number[] | null => {
  if (labels.length < 2) return null;

  const breaks = new Set<number>();

  for (const label of labels) {
    const numbers = label.match(/-?\d+(?:\.\d+)?/g);
    if (!numbers) return null;
    for (const number of numbers) breaks.add(Number(number));
  }

  if (breaks.size !== labels.length - 1) return null;

  return [...breaks].sort((a, b) => a - b);
};

// `counts` is a union of array-likes in the ArcGIS typings, hence the spread before `reduce`.
const getHistogramTotal = (histogram: __esri.RasterHistogram) =>
  [...histogram.counts].reduce((total, count) => total + count, 0);

/** Centre of bin `index`. ArcGIS spreads `size` equal-width bins over `[min, max]`. */
const getBinCentre = (histogram: __esri.RasterHistogram, index: number) =>
  histogram.min + ((index + 0.5) * (histogram.max - histogram.min)) / histogram.size;

/**
 * Pixel share per legend class: RANGE legends place each histogram bin against the parsed breaks,
 * CATEG legends on the nearest colormap value instead (the nth colormap entry and the nth legend
 * item describe the same class). Either way each bin is counted once and only once, which keeps
 * the shares summing to 100 even when the service returns a histogram coarse enough to put two
 * class values in one bin.
 *
 * Null when the legend cannot be read, an empty array when the area holds no pixels.
 */
export const getClassDistribution = ({
  histograms,
  legend,
  rasterFunction,
}: {
  histograms: __esri.RasterHistogram[];
  legend: ResourceImagery["legend"];
  rasterFunction: ResourceImagery["rasterFunction"];
}): ClassShare[] | null => {
  const [histogram] = histograms ?? [];
  const items = legend?.items ?? [];
  const labels = items.flatMap((item) => (item.label ? [item.label] : []));

  if (!histogram || !histogram.size || labels.length === 0 || labels.length !== items.length) {
    return null;
  }

  const breaks = parseLegendBreaks(labels);
  let getClassIndex: (value: number) => number;

  if (breaks) {
    getClassIndex = (value) => breaks.filter((bound) => value >= bound).length;
  } else {
    const colormap = rasterFunction?.functionArguments?.colormap as number[][] | undefined;
    if (!Array.isArray(colormap) || colormap.length !== labels.length) return null;

    const values = colormap.map(([value]) => value);
    getClassIndex = (value) =>
      values.reduce(
        (best, candidate, index) =>
          Math.abs(candidate - value) < Math.abs(values[best] - value) ? index : best,
        0,
      );
  }

  const total = getHistogramTotal(histogram);
  if (total === 0) return [];

  const counts = new Array<number>(labels.length).fill(0);

  histogram.counts.forEach((count, index) => {
    counts[getClassIndex(getBinCentre(histogram, index))] += count;
  });

  return labels.map((label, index) => ({
    label,
    percentage: roundTo((counts[index] / total) * 100),
  }));
};

/**
 * Anything other than `sum` or `mean` yields no scalar, so an indicator with no aggregation reads
 * as "not measured" rather than silently getting a meaningless total.
 *
 * The `sum` fallback keeps the bin weighting the numeric widget has always used
 * (`min + index * max / (size - 1)`, which overstates a raster whose min is not 0). It is wrong,
 * but it is the figure printed on the cards, and a narrative that disagreed with the card facing
 * it would be the worse bug. Correcting it is a data-team change across every imagery card at once.
 */
export const getImageryScalar = (
  data:
    | { histograms?: __esri.RasterHistogram[]; statistics?: __esri.RasterBandStatistics[] }
    | null
    | undefined,
  aggregation: ImageryAggregation,
): number | null => {
  const [statistics] = data?.statistics ?? [];

  if (aggregation === "mean") return typeof statistics?.avg === "number" ? statistics.avg : null;
  if (aggregation !== "sum") return null;
  if (typeof statistics?.sum === "number") return statistics.sum;

  const histograms = data?.histograms ?? [];
  if (histograms.length === 0) return null;

  return histograms.reduce(
    (total, histogram) =>
      total +
      [...histogram.counts].reduce(
        (sum, count, index) =>
          sum + count * (histogram.min + (index * histogram.max) / (histogram.size - 1)),
        0,
      ),
    0,
  );
};

/** Separates a raster the area does not overlap from one whose service failed. */
export const hasImageryCoverage = (histograms: __esri.RasterHistogram[] | undefined): boolean =>
  (histograms ?? []).some((histogram) => histogram.counts.some((count) => count > 0));
