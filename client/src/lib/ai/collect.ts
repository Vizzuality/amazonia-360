import { classDistribution, hasImageryCoverage, imageryScalar } from "@/lib/imagery";
import { QueryFeatureIdParams, QueryImageryIdParams } from "@/lib/indicators";

import { Indicator, ResourceFeature, ResourceImagery } from "@/types/indicator";

import { featureEvidence, IndicatorEvidence, IndicatorEvidenceStatus } from "./evidence";

export type EvidenceQueries = {
  queryFeature: (params: QueryFeatureIdParams) => Promise<__esri.FeatureSet | null>;
  queryImagery: (params: QueryImageryIdParams) => Promise<{
    histograms: __esri.RasterHistogram[];
    statistics: __esri.RasterBandStatistics[];
  } | null>;
};

type EvidenceOutcome = {
  status: IndicatorEvidenceStatus;
  evidence?: IndicatorEvidence["evidence"];
};

export type CollectTopicEvidenceParams = {
  indicators: Indicator[];
  geometry: __esri.Polygon | null;
  timeoutMs?: number;
};

export type TopicEvidence = {
  indicators: IndicatorEvidence[];
  /** Indicators the summary can speak to: `ok` plus the genuine `no_coverage` findings. */
  included: number;
  /** Everything except `not_supported`, so a by-design exclusion never reads as a shortfall. */
  total: number;
};

/**
 * Only these two resource types can be measured over an arbitrary polygon. h3 indicators are
 * excluded on purpose — they are not topic cards and their values are not part of the narrative
 * — and `component`, `web-tile` and `imagery-tile` have nothing to query.
 */
const SUPPORTED_TYPES = new Set(["feature", "imagery"]);

/**
 * One slow ArcGIS service must not hold up the whole summary. Longer than the browser would
 * usually wait for a single layer, short enough that a topic of ten indicators still returns.
 */
const DEFAULT_TIMEOUT_MS = 20_000;

const withTimeout = <T>(work: Promise<T>, ms: number): Promise<T> =>
  new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("evidence timeout")), ms);
    work.then(resolve, reject).finally(() => clearTimeout(timer));
  });

const hasQuery = (query: unknown): boolean =>
  !!query && typeof query === "object" && Object.keys(query).length > 0;

const collectFeature = async (
  indicator: Indicator,
  resource: ResourceFeature,
  geometry: __esri.Polygon | null,
  queries: EvidenceQueries,
): Promise<EvidenceOutcome> => {
  if (!hasQuery(resource.query_ai)) return { status: "unavailable" };

  const featureSet = await queries.queryFeature({
    id: indicator.id,
    type: "ai",
    resource,
    geometry,
  });

  if (!featureSet?.features) return { status: "unavailable" };
  if (featureSet.features.length === 0) return { status: "no_coverage" };

  return { status: "ok", evidence: featureEvidence(featureSet.features) };
};

const collectImagery = async (
  indicator: Indicator,
  resource: ResourceImagery,
  geometry: __esri.Polygon | null,
  queries: EvidenceQueries,
): Promise<EvidenceOutcome> => {
  const data = await queries.queryImagery({
    id: indicator.id,
    type: "ai",
    resource,
    geometry,
  });

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
      ...(distribution && distribution.length > 0 && { distribution }),
    },
  };
};

/**
 * Gathers what every indicator on a topic can actually say about the analysis area, so the
 * summary works from measured values instead of filling the gaps with prose. Each indicator
 * comes back with a status; nothing is silently dropped, and a service failure is separated
 * from a genuine absence of data.
 */
export const collectTopicEvidence = async (
  { indicators, geometry, timeoutMs = DEFAULT_TIMEOUT_MS }: CollectTopicEvidenceParams,
  queries: EvidenceQueries,
): Promise<TopicEvidence> => {
  const settled = await Promise.allSettled(
    indicators.map((indicator) => {
      const { resource } = indicator;

      if (!SUPPORTED_TYPES.has(resource.type)) {
        return Promise.resolve<EvidenceOutcome>({ status: "not_supported" });
      }

      const work =
        resource.type === "feature"
          ? collectFeature(indicator, resource as ResourceFeature, geometry, queries)
          : collectImagery(indicator, resource as ResourceImagery, geometry, queries);

      return withTimeout(work, timeoutMs);
    }),
  );

  const collected = settled.map((result, index) => {
    const indicator = indicators[index];
    const outcome: EvidenceOutcome =
      result.status === "fulfilled" ? result.value : { status: "unavailable" };

    return {
      id: indicator.id,
      ...(indicator.name && { name: indicator.name }),
      ...(indicator.unit && { unit: indicator.unit }),
      status: outcome.status,
      ...(outcome.evidence ? { evidence: outcome.evidence } : {}),
    } satisfies IndicatorEvidence;
  });

  const supported = collected.filter((entry) => entry.status !== "not_supported");

  return {
    indicators: collected,
    included: supported.filter((entry) => entry.status === "ok" || entry.status === "no_coverage")
      .length,
    total: supported.length,
  };
};
