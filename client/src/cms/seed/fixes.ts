import { rawIndicators, rawSubtopics } from "./source";

/**
 * Fix 1. Subtopic 26 "Security Infrastructure" has a single `default_visualization` entry
 * pointing at indicator 55, which does not exist — the id sequence confirms deletion
 * (50–54 and 56–60 are all present). Dropping the entry would leave the subtopic with no
 * pre-configured widgets, so it is repointed at indicator 146 "Police Infrastructure
 * Network": the first indicator by `order` in that subtopic, and it supports `map`.
 * Geometry (`type: map, x0 y0 w2 h4`) is preserved by the caller.
 */
export const SUBTOPIC_DEFAULT_VIS_FIX = { owner: 26, from: 55, to: 146 } as const;

/**
 * Fix 2. Indicator 5 "Administrative Capitals" declares [map, numeric] but carries a
 * `query_chart`. A deliberate product change: the chart widget becomes available.
 */
export const INDICATOR_ADDS_CHART = 5;

/**
 * Fix 3. Indicator 12 "Indigenous Territories" is `type: feature` but carries
 * `rasterFunction: 'Forest_Cover_Change'` — a bare string where the shape is an object, on
 * a layer type that cannot use raster functions. The `feature` block has no such field, so
 * the value is dropped. Recorded so the drop is a decision, not an accident.
 */
export const INDICATOR_DROPS_RASTER_FUNCTION = 12;

export function resolveFixedIndicatorId(ownerLegacyId: number, indicatorLegacyId: number): number {
  const { owner, from, to } = SUBTOPIC_DEFAULT_VIS_FIX;
  if (ownerLegacyId === owner && indicatorLegacyId === from) return to;
  return indicatorLegacyId;
}

export function fixVisualizationTypes(legacyId: number, types: string[]): string[] {
  if (legacyId !== INDICATOR_ADDS_CHART) return types;
  if (types.includes("chart")) return types;
  return [...types, "chart"];
}

export type FixReport = { collection: string; legacy_id: number; change: string };

/** Inspects the real source so a logged fix is always one that actually applies. */
export function describeAppliedFixes(): FixReport[] {
  const reports: FixReport[] = [];

  const { owner, from, to } = SUBTOPIC_DEFAULT_VIS_FIX;
  const subtopic = rawSubtopics.find((s) => s.id === owner);
  if (subtopic?.default_visualization?.some((e) => e.indicator_id === from)) {
    reports.push({
      collection: "subtopics",
      legacy_id: owner,
      change: `default_visualization indicator ${from} -> ${to}`,
    });
  }

  const chartRow = rawIndicators.find((i) => i.id === INDICATOR_ADDS_CHART);
  if (chartRow && !(chartRow.visualization_types ?? []).includes("chart")) {
    reports.push({
      collection: "indicators",
      legacy_id: INDICATOR_ADDS_CHART,
      change: "visualization_types += chart",
    });
  }

  const rasterRow = rawIndicators.find((i) => i.id === INDICATOR_DROPS_RASTER_FUNCTION);
  if (rasterRow?.resource.rasterFunction) {
    reports.push({
      collection: "indicators",
      legacy_id: INDICATOR_DROPS_RASTER_FUNCTION,
      change: "dropped resource.rasterFunction",
    });
  }

  return reports;
}
