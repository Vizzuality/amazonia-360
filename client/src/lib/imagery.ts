import { roundTo } from "@/lib/utils";

import { ImageryAggregation, ResourceImagery } from "@/types/indicator";

export type ClassShare = {
  label: string;
  /**
   * Share of the pixels that carry data inside the analysis area, 0-100. NoData is not counted
   * either way, so this is the composition of the raster's coverage of the area rather than of
   * the area itself. Shares across a legend sum to 100.
   */
  percentage: number;
};

/**
 * Splits a legend into RANGE (numeric breaks) and CATEG (named classes). Nothing in
 * `datum/indicators.json` records which is which — every imagery legend is `type: "basic"` — so
 * it is read back off the labels.
 *
 * A legend is RANGE when every label carries a number and the distinct numbers across all labels
 * are exactly one fewer than the labels, i.e. they are the interior breaks:
 * `["< 5", "5 - 50", "50 - 200", "200 - 1000", "> 1000"]` yields `[5, 50, 200, 1000]`. The count
 * check is what stops a categorical label that happens to mention a number from parsing.
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

export const isRangeLegend = (labels: string[]): boolean => parseLegendBreaks(labels) !== null;

const histogramTotal = (histogram: __esri.RasterHistogram) =>
  [...histogram.counts].reduce((total, count) => total + count, 0);

/** Centre of bin `index`. ArcGIS spreads `size` equal-width bins over `[min, max]`. */
const binCentre = (histogram: __esri.RasterHistogram, index: number) =>
  histogram.min + ((index + 0.5) * (histogram.max - histogram.min)) / histogram.size;

const classIndexForBreaks = (breaks: number[], value: number) => {
  let index = 0;
  while (index < breaks.length && value >= breaks[index]) index += 1;
  return index;
};

const classIndexForColormap = (values: number[], value: number) =>
  values.reduce(
    (best, candidate, index) =>
      Math.abs(candidate - value) < Math.abs(values[best] - value) ? index : best,
    0,
  );

/**
 * Pixel share per legend class.
 *
 * RANGE legends place each histogram bin against the parsed breaks. CATEG legends place it on the
 * nearest colormap value instead: the nth colormap entry and the nth legend item describe the same
 * class, and the entry's first element is that class's pixel value. Either way each bin is counted
 * once and only once, which is what keeps the shares summing to 100 even when the service returns
 * a histogram coarse enough to put two class values in one bin.
 *
 * Returns null when the legend cannot be read, and an empty array when the area holds no pixels.
 */
export const classDistribution = ({
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
  const colormap = rasterFunction?.functionArguments?.colormap as number[][] | undefined;

  let classIndexFor: (value: number) => number;

  if (breaks) {
    classIndexFor = (value) => classIndexForBreaks(breaks, value);
  } else {
    if (!Array.isArray(colormap) || colormap.length !== labels.length) return null;

    const values = colormap.map(([value]) => value);
    classIndexFor = (value) => classIndexForColormap(values, value);
  }

  const total = histogramTotal(histogram);
  if (total === 0) return [];

  const counts = new Array<number>(labels.length).fill(0);

  [...histogram.counts].forEach((count, index) => {
    counts[classIndexFor(binCentre(histogram, index))] += count;
  });

  return labels.map((label, index) => ({
    label,
    percentage: roundTo((counts[index] / total) * 100),
  }));
};

/**
 * The one number an imagery raster reduces to over an area, per its authored `aggregation`.
 * Anything other than `sum` or `mean` yields no scalar, so an indicator with no aggregation reads
 * as "not measured" rather than silently getting a meaningless total.
 *
 * The `sum` fallback keeps the bin weighting the numeric widget has always used
 * (`min + index * max / (size - 1)`, which overstates a raster whose min is not 0). It is wrong,
 * but it is the figure printed on the cards, and a narrative that disagreed with the card facing
 * it would be the worse bug. Correct it in both places at once, with the data team.
 */
export const imageryScalar = (
  data:
    | {
        histograms?: __esri.RasterHistogram[];
        statistics?: __esri.RasterBandStatistics[];
      }
    | null
    | undefined,
  aggregation: ImageryAggregation,
): number | null => {
  if (!data) return null;

  const [statistics] = data.statistics ?? [];

  if (aggregation === "mean") {
    return typeof statistics?.avg === "number" ? statistics.avg : null;
  }

  if (aggregation !== "sum") return null;

  if (typeof statistics?.sum === "number") return statistics.sum;

  const histograms = data.histograms ?? [];
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

/**
 * Whether an imagery query found anything inside the analysis area. Separates a raster the area
 * does not overlap from one whose service failed.
 */
export const hasImageryCoverage = (histograms: __esri.RasterHistogram[] | undefined): boolean =>
  (histograms ?? []).some((histogram) => histogramTotal(histogram) > 0);
