/**
 * The closed vocabularies the MCP catalogue reads.
 *
 * They live in one module because every one of them is a contract with something outside this
 * repository: the intake workbook the IDB consultant fills, the ingest that loads it, and the MCP
 * tools that branch on the value. A vocabulary retyped in two places diverges silently — an
 * `area_weighted_mean` here against an `areaWeightedMean` there drops indicators from an answer
 * with no error raised anywhere.
 *
 * Multi-word values are snake_case throughout. The intake workbook shipped `restricted-review` and
 * `one-off` with hyphens; those two are normalised here and the workbook has to follow, or the
 * import will write values no select can hold.
 */

export type VocabularyOption = { label: string; value: string };

/**
 * How a tool reduces many values to one over the area asked about.
 *
 * The most consequential field in the catalogue, and the only one whose absence produces a wrong
 * number rather than a missing one: population can be summed across municipalities, density and
 * every index cannot. A tool that guesses `sum` prints a plausible total for something that has no
 * total.
 *
 * `area_weighted_mean` and `min` extend what `ImageryAggregation` (types/indicator.ts) already
 * offers. The three imagery values stay a strict subset — see IMAGERY_AGGREGATION_OPTIONS.
 */
export const AGGREGATION_OPTIONS = [
  { label: "Sum", value: "sum" },
  { label: "Mean", value: "mean" },
  { label: "Area-weighted mean", value: "area_weighted_mean" },
  { label: "Minimum", value: "min" },
  { label: "None (categorical)", value: "none" },
] as const satisfies readonly VocabularyOption[];

export type Aggregation = (typeof AGGREGATION_OPTIONS)[number]["value"];

/**
 * What `cms/fields/resource.ts` offers on the imagery block today, and all that a raster reduction
 * can mean. Kept as its own list rather than as a filter over AGGREGATION_OPTIONS so that adding a
 * value above cannot widen the imagery block by accident.
 */
export const IMAGERY_AGGREGATION_OPTIONS = [
  { label: "Sum", value: "sum" },
  { label: "Mean", value: "mean" },
  { label: "None (categorical)", value: "none" },
] as const satisfies readonly VocabularyOption[];

/**
 * What the number is, so a tool can reject a meaningless operation before it runs it.
 *
 * Distinct from `unit`: two indicators both in km² can be an `area` and a `distance`, and only one
 * of them survives being summed.
 */
export const VALUE_TYPE_OPTIONS = [
  { label: "Count", value: "count" },
  { label: "Area", value: "area" },
  { label: "Length", value: "length" },
  { label: "Distance", value: "distance" },
  { label: "Ratio", value: "ratio" },
  { label: "Index", value: "index" },
  { label: "Density", value: "density" },
  { label: "Categorical", value: "categorical" },
] as const satisfies readonly VocabularyOption[];

export type ValueType = (typeof VALUE_TYPE_OPTIONS)[number]["value"];

/**
 * Whether a generated answer may quote this indicator at all.
 *
 * An explicit field set by a person, deliberately not a keyword match on the indicator name: a
 * keyword list finds sensitive names, not sensitive content. `restricted_review` is the state for
 * an indicator whose status nobody has settled yet, and it is not the same as `restricted`.
 */
export const SENSITIVITY_OPTIONS = [
  { label: "Public", value: "public" },
  { label: "Restricted", value: "restricted" },
  { label: "Restricted — pending review", value: "restricted_review" },
  { label: "Indigenous data", value: "indigenous_data" },
] as const satisfies readonly VocabularyOption[];

export type Sensitivity = (typeof SENSITIVITY_OPTIONS)[number]["value"];

/**
 * How often the source says it republishes.
 *
 * Without it a freshness check has nothing to compare against: a layer cannot be called stale if
 * nobody stated how often it was meant to move. `unknown` is a real answer and has to stay
 * available, or the field gets filled with a guess.
 */
export const UPDATE_CADENCE_OPTIONS = [
  { label: "Monthly", value: "monthly" },
  { label: "Quarterly", value: "quarterly" },
  { label: "Biannual", value: "biannual" },
  { label: "Annual", value: "annual" },
  { label: "Irregular", value: "irregular" },
  { label: "One-off", value: "one_off" },
  { label: "Unknown", value: "unknown" },
] as const satisfies readonly VocabularyOption[];

export type UpdateCadence = (typeof UPDATE_CADENCE_OPTIONS)[number]["value"];

/**
 * How the last sync run ended, per indicator.
 *
 * Separates "empty because there is nothing upstream" from "empty because we could not read it",
 * which are indistinguishable today. The 27 imagery indicators land on `item_inaccessible`: their
 * ArcGIS Online items are not publicly shared, so none of the provenance below can be fetched for
 * them by any route.
 */
export const SYNC_STATUS_OPTIONS = [
  { label: "OK", value: "ok" },
  { label: "Error", value: "error" },
  { label: "Item inaccessible", value: "item_inaccessible" },
] as const satisfies readonly VocabularyOption[];

export type SyncStatus = (typeof SYNC_STATUS_OPTIONS)[number]["value"];

/**
 * GADM administrative levels, as strings because a Payload select stores strings and `0` would be
 * indistinguishable from an unset field on read.
 */
export const ADMIN_LEVEL_OPTIONS = [
  { label: "0 — country", value: "0" },
  { label: "1 — first subdivision", value: "1" },
  { label: "2 — second subdivision", value: "2" },
] as const satisfies readonly VocabularyOption[];

export type AdminLevel = (typeof ADMIN_LEVEL_OPTIONS)[number]["value"];

/**
 * Which levels an indicator can answer at, derived rather than typed in.
 *
 * The rule, as the IDB consultant stated it and we agreed: data that arrives already aggregated by
 * administrative unit is valid at its own level and at every level that contains it, never below.
 * Level 2 therefore yields 0, 1 and 2; level 1 yields 0 and 1; an indicator with no collection
 * level — every geometry layer, where a spatial intersection answers anywhere — yields all three.
 *
 * Derived in code and not stored, for two reasons. A stored copy goes stale the moment
 * `collected_at_level` is corrected, and as a `hasMany` select it would cost two tables and two
 * enum types for a value that is a pure function of a field sitting next to it.
 *
 * Note what this does NOT say. It answers "the data cannot be broken below its unit". It says
 * nothing about whether the layer covers the area asked about — that is `spatial_coverage` — and
 * the two do not substitute for one another. Nor do the levels reconcile: summing levels 1 and 2
 * fails to reconstruct level 0 in 6 of the 8 countries.
 */
export function adminLevelsSupported(collectedAtLevel?: AdminLevel | null): AdminLevel[] {
  const levels = ADMIN_LEVEL_OPTIONS.map((option) => option.value);

  if (!collectedAtLevel) return [...levels];

  return levels.filter((level) => level <= collectedAtLevel);
}
