import { useMutation, UseMutationOptions } from "@tanstack/react-query";

import { ClassShare, classDistribution, hasImageryCoverage, imageryScalar } from "@/lib/imagery";
import { getIndicators, getQueryFeatureId, getQueryImageryId } from "@/lib/indicators";
import { roundTo } from "@/lib/utils";

import { Context, ContextDescriptionType, ContextLanguage } from "@/types/generated/api.schemas";
import { generateDescriptionTextAiPost } from "@/types/generated/text-generation";
import { ImageryAggregation, Indicator, ResourceFeature, ResourceImagery } from "@/types/indicator";
import { Topic } from "@/types/topic";

export type AiSummary = {
  type?: ContextDescriptionType;
  only_active?: boolean;
  enabled?: boolean;
  generating?: Record<string, boolean>;
};

/**
 * - `ok` — read successfully, has values.
 * - `no_coverage` — read successfully, the area genuinely has none. The only state that licenses
 *   the summary to say data is absent.
 * - `unavailable` — the read failed. A fault on our side, never a finding about the Amazon.
 * - `not_supported` — this resource kind cannot be measured over a polygon at all.
 */
export type IndicatorEvidenceStatus = "ok" | "no_coverage" | "unavailable" | "not_supported";

export type FeatureEvidence = {
  feature_count: number;
  /** Area of the analysis polygon covered by the layer. Only queries that return intersections. */
  area_km2?: number;
  /** `area_km2` as a share of the whole analysis area, 0-100. */
  area_share?: number;
  classes?: { label: string; feature_count: number; area_km2?: number; percentage?: number }[];
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

export type TopicEvidence = {
  indicators: IndicatorEvidence[];
  /** Indicators the summary can speak to: `ok` plus the genuine `no_coverage` findings. */
  included: number;
  /** Everything except `not_supported`, so a by-design exclusion never reads as a shortfall. */
  total: number;
};

/** Beyond this the payload stops being prose material and starts being a data dump. */
const MAX_CLASSES = 15;

/** First non-empty string among these wins: `query_ai` asks for `outFields: ["*"]`. */
const LABEL_KEYS = ["label", "name", "nombre", "natname"];

const readLabel = (attributes: Record<string, unknown>) => {
  const byKey = new Map(
    Object.entries(attributes).map(([key, value]) => [key.toLowerCase(), value]),
  );

  return LABEL_KEYS.map((key) => byKey.get(key)).find(
    (value): value is string => typeof value === "string" && value !== "",
  );
};

const readNumber = (value: unknown) =>
  typeof value === "number" && Number.isFinite(value) ? value : undefined;

/**
 * Forwarding the raw `outFields: ["*"]` attributes would spend most of the model's context on ids
 * and geometry bookkeeping. Queries that return intersections carry a per-feature `value` in km²
 * and the analysis area in `total` (see `getQueryFeatureId`); the rest only say how many features
 * fall inside and what they are called.
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

  for (const { label, value } of rows) {
    if (!label) continue;

    const entry = grouped.get(label) ?? { feature_count: 0 };
    entry.feature_count += 1;
    if (value !== undefined) entry.area_km2 = (entry.area_km2 ?? 0) + value;
    grouped.set(label, entry);
  }

  const classes = [...grouped.entries()]
    .map(([label, { feature_count, area_km2 }]) => ({
      label,
      feature_count,
      area_km2: area_km2 === undefined ? undefined : roundTo(area_km2, 2),
      percentage:
        area_km2 !== undefined && totalArea ? roundTo((area_km2 / totalArea) * 100) : undefined,
    }))
    .sort((a, b) => (b.area_km2 ?? b.feature_count) - (a.area_km2 ?? a.feature_count));

  return {
    feature_count: features.length,
    area_km2: area === undefined ? undefined : roundTo(area, 2),
    area_share: area !== undefined && totalArea ? roundTo((area / totalArea) * 100) : undefined,
    classes: classes.length > 0 ? classes.slice(0, MAX_CLASSES) : undefined,
    classes_truncated: classes.length > MAX_CLASSES ? true : undefined,
  };
};

type EvidenceOutcome = Pick<IndicatorEvidence, "status" | "evidence">;

const featureOutcome = async (
  id: Indicator["id"],
  resource: ResourceFeature,
  geometry: __esri.Polygon,
): Promise<EvidenceOutcome> => {
  if (!resource.query_ai) return { status: "unavailable" };

  const featureSet = await getQueryFeatureId({ id, type: "ai", resource, geometry });

  if (!featureSet?.features) return { status: "unavailable" };
  if (featureSet.features.length === 0) return { status: "no_coverage" };

  return { status: "ok", evidence: featureEvidence(featureSet.features) };
};

const imageryOutcome = async (
  id: Indicator["id"],
  resource: ResourceImagery,
  geometry: __esri.Polygon,
): Promise<EvidenceOutcome> => {
  const data = await getQueryImageryId({ id, type: "ai", resource, geometry });

  if (!data) return { status: "unavailable" };
  if (!hasImageryCoverage(data.histograms)) return { status: "no_coverage" };

  const distribution = classDistribution({
    histograms: data.histograms,
    legend: resource.legend,
    rasterFunction: resource.rasterFunction,
  });

  return {
    status: "ok",
    evidence: {
      aggregation: resource.aggregation,
      value: imageryScalar(data, resource.aggregation),
      distribution: distribution?.length ? distribution : undefined,
    },
  };
};

export const collectTopicEvidence = async (
  indicators: Indicator[],
  geometry: __esri.Polygon | null,
): Promise<TopicEvidence> => {
  // Without an area there is nothing to measure, and an unfiltered `query_ai` would pull whole
  // layers down only for `getQueryFeatureId` to throw them away.
  if (!geometry) return { indicators: [], included: 0, total: 0 };

  const settled = await Promise.allSettled(
    indicators.map(({ id, resource }): Promise<EvidenceOutcome> => {
      if (resource.type === "feature") return featureOutcome(id, resource, geometry);
      if (resource.type === "imagery") return imageryOutcome(id, resource, geometry);

      // h3 indicators live in the report's grid section rather than as topic cards and are not
      // part of the narrative; `component`, `web-tile` and `imagery-tile` have nothing to query.
      return Promise.resolve({ status: "not_supported" });
    }),
  );

  const collected = settled.map((result, index): IndicatorEvidence => {
    const { id, name, unit } = indicators[index];
    const outcome: EvidenceOutcome =
      result.status === "fulfilled" ? result.value : { status: "unavailable" };

    return { id, name: name || undefined, unit: unit || undefined, ...outcome };
  });

  const supported = collected.filter(({ status }) => status !== "not_supported");

  return {
    indicators: collected,
    included: supported.filter(({ status }) => status === "ok" || status === "no_coverage").length,
    total: supported.length,
  };
};

export type GetAISummaryParams = Context;

export const getAISummary = (params: GetAISummaryParams) => {
  return generateDescriptionTextAiPost(params);
};

export const postSummaryTopic = async (params: {
  topic?: Topic;
  options: AiSummary;
  activeIndicators?: Indicator["id"][];
  locale: string;
  location: __esri.Polygon | null;
}) => {
  const { topic, options, locale, activeIndicators, location } = params;
  const only = options?.only_active ? activeIndicators : undefined;

  const allIndicators = await getIndicators(locale);

  const indicators = allIndicators.filter(
    (indicator) =>
      (!topic || indicator.subtopic.topic_id === topic.id) &&
      (!only || only.includes(indicator.id)),
  );

  const evidence = await collectTopicEvidence(indicators, location);

  // Formatting and tone rules live in the API's system prompt (api/src/app/openai_service.py),
  // not here: the client sends measurements, the service decides how to read them.
  const response = await getAISummary({
    data: {
      topic: topic?.name,
      indicators: evidence.indicators,
      indicators_included: evidence.included,
      indicators_total: evidence.total,
    },
    language: locale as ContextLanguage,
    description_type: options?.type,
  });

  return { ...response, included: evidence.included, total: evidence.total };
};

export type GetSummaryTopicCompleteMutationOptions<TData, TError> = UseMutationOptions<
  Awaited<ReturnType<typeof postSummaryTopic>>,
  TError,
  Parameters<typeof postSummaryTopic>[0],
  TData
>;

export const usePostSummaryTopicMutation = <
  TData = Awaited<ReturnType<typeof postSummaryTopic>>,
  TError = unknown,
>(
  options?: Omit<GetSummaryTopicCompleteMutationOptions<TData, TError>, "mutationFn">,
) => {
  return useMutation({
    mutationFn: postSummaryTopic,
    ...options,
  });
};
