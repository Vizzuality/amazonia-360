import type { CollectionBeforeChangeHook } from "payload";

/** Visualization types that have a corresponding `query_*` field on a feature resource. */
const QUERYABLE_TYPES = ["numeric", "table", "chart"] as const;

export type QueryableVisualizationType = (typeof QUERYABLE_TYPES)[number];

export type VisualizationMismatch = {
  kind: "declared-without-query" | "query-without-declared";
  type: QueryableVisualizationType;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isPresentQuery = (value: unknown): boolean =>
  isRecord(value) && Object.keys(value).length > 0;

/**
 * Reports disagreements between an indicator's declared `visualization_types` and the
 * `query_*` objects on its resource.
 *
 * Scoped to `feature` resources on purpose:
 * - `map` has no `query_map`, so it can never be cross-checked.
 * - `imagery` numerics come from `computeStatisticsHistograms`, not a query, so 17 valid
 *   rows declare `numeric` with no `query_numeric`. Flagging those would be pure noise.
 * - `h3` and `component` declare nothing queryable.
 */
export const findVisualizationMismatches = (input: {
  visualization_types?: unknown;
  resource?: unknown;
}): VisualizationMismatch[] => {
  const resource = isRecord(input.resource) ? input.resource : null;

  if (resource?.blockType !== "feature") return [];

  const declared = new Set(
    Array.isArray(input.visualization_types) ? input.visualization_types : [],
  );

  return QUERYABLE_TYPES.flatMap<VisualizationMismatch>((type) => {
    const hasQuery = isPresentQuery(resource[`query_${type}`]);
    const isDeclared = declared.has(type);

    if (isDeclared && !hasQuery) return [{ kind: "declared-without-query", type }];
    if (hasQuery && !isDeclared) return [{ kind: "query-without-declared", type }];

    return [];
  });
};

/**
 * Non-blocking: logs a warning and always returns `data` unchanged.
 *
 * Must not be a `validate` function — that can only pass or fail, and failing would stop
 * phase-2 seeding of indicator 5, which legitimately carries this inconsistency today.
 */
export const warnOnVisualizationMismatch: CollectionBeforeChangeHook = ({ req, data }) => {
  const resource = Array.isArray(data?.resource) ? data.resource[0] : data?.resource;

  for (const mismatch of findVisualizationMismatches({
    visualization_types: data?.visualization_types,
    resource,
  })) {
    const detail =
      mismatch.kind === "declared-without-query"
        ? `declares "${mismatch.type}" but has no query_${mismatch.type}`
        : `has a query_${mismatch.type} but does not declare "${mismatch.type}"`;

    req.payload.logger.warn(
      `Indicator ${data?.legacy_id ?? "(new)"} ${detail}. The widget may render empty.`,
    );
  }

  return data;
};
