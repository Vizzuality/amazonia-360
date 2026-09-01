import { ClassShare } from "@/lib/imagery";
import { roundTo } from "@/lib/utils";

import { ImageryAggregation } from "@/types/indicator";

/** The four evidence statuses, and why they are four, are defined in `.claude/CONTEXT.md`. */
export type IndicatorEvidenceStatus = "ok" | "no_coverage" | "unavailable" | "not_supported";

export type FeatureEvidence = {
  feature_count: number;
  /** Area of the analysis polygon covered by the layer. Only queries that return intersections. */
  area_km2?: number;
  /** `area_km2` as a share of the whole analysis area, 0-100. */
  area_share?: number;
  classes?: {
    label: string;
    feature_count: number;
    area_km2?: number;
    percentage?: number;
  }[];
  /** True when `classes` was capped, so the summary knows it is not the whole list. */
  classes_truncated?: boolean;
};

export type ImageryEvidence = {
  aggregation: ImageryAggregation;
  value: number | null;
  distribution?: ClassShare[];
};

export type IndicatorEvidence = {
  id: number;
  name?: string;
  unit?: string;
  status: IndicatorEvidenceStatus;
  evidence?: FeatureEvidence | ImageryEvidence;
};

/** Beyond this the payload stops being prose material and starts being a data dump. */
const MAX_CLASSES = 15;

const NAME_KEYS = ["name", "nombre", "natname"];

const findString = (attributes: Record<string, unknown>, keys: string[]) => {
  for (const [key, value] of Object.entries(attributes)) {
    if (keys.includes(key.toLowerCase()) && typeof value === "string" && !!value) return value;
  }

  return undefined;
};

const readLabel = (attributes: Record<string, unknown>) =>
  findString(attributes, ["label"]) ?? findString(attributes, NAME_KEYS);

const readNumber = (value: unknown): number | undefined =>
  typeof value === "number" && Number.isFinite(value) ? value : undefined;

/**
 * Compacts an ArcGIS feature set into the few numbers a summary can actually use.
 *
 * `query_ai` asks for `outFields: ["*"]`, so forwarding the raw attributes would spend most of
 * the model's context on ids and geometry bookkeeping. Queries that return intersections carry
 * a per-feature `value` in km² and the analysis area in `total` (see `getQueryFeatureId`); the
 * rest only tell us how many features fall inside and what they are called.
 */
export const featureEvidence = (
  features: { attributes: Record<string, unknown> }[],
): FeatureEvidence => {
  const rows = features.map(({ attributes }) => ({
    label: readLabel(attributes),
    value: readNumber(attributes.value),
    total: readNumber(attributes.total),
  }));

  const areas = rows.filter((row) => row.value !== undefined);
  const totalArea = rows.find((row) => row.total !== undefined)?.total;
  const area = areas.length > 0 ? areas.reduce((sum, row) => sum + row.value!, 0) : undefined;

  const grouped = new Map<string, { feature_count: number; area_km2?: number }>();
  for (const row of rows) {
    if (!row.label) continue;

    const entry = grouped.get(row.label) ?? { feature_count: 0 };
    entry.feature_count += 1;
    if (row.value !== undefined) entry.area_km2 = (entry.area_km2 ?? 0) + row.value;
    grouped.set(row.label, entry);
  }

  const ranked = [...grouped.entries()]
    .map(([label, entry]) => ({
      label,
      feature_count: entry.feature_count,
      ...(entry.area_km2 !== undefined && { area_km2: roundTo(entry.area_km2, 2) }),
      ...(entry.area_km2 !== undefined &&
        totalArea && { percentage: roundTo((entry.area_km2 / totalArea) * 100) }),
    }))
    .sort((a, b) => (b.area_km2 ?? b.feature_count) - (a.area_km2 ?? a.feature_count));

  return {
    feature_count: features.length,
    ...(area !== undefined && { area_km2: roundTo(area, 2) }),
    ...(area !== undefined && totalArea && { area_share: roundTo((area / totalArea) * 100) }),
    ...(ranked.length > 0 && { classes: ranked.slice(0, MAX_CLASSES) }),
    ...(ranked.length > MAX_CLASSES && { classes_truncated: true }),
  };
};
