import { CmsMeta } from "@/types/cms";
import { Subtopic, TopicSummary } from "@/types/topic";

import { IndicatorView } from "@/app/(frontend)/parsers";

import { Indicator as CmsIndicator } from "@/payload-types";

export type VisualizationTypes = "map" | "table" | "chart" | "numeric" | "ai" | "custom";

type ResourceQuery = (__esri.QueryProperties & { returnIntersections?: boolean }) | null;

type CmsResourceBlock = CmsIndicator["resource"][number];

/**
 * One resource block off the generated Indicator. The block type is the resource type, so
 * `Extract` keeps the discriminated union the CMS already models and a resource kind added
 * to the collection needs no declaration here at all.
 *
 * `blockName` and `id` are Payload's per-row bookkeeping and are dropped: nothing reads them,
 * and leaving them in invites code that does.
 */
type ResourceBlock<TBlock extends CmsResourceBlock["blockType"]> = Omit<
  Extract<CmsResourceBlock, { blockType: TBlock }>,
  "blockName" | "id"
>;

/**
 * The CMS stores the ArcGIS objects as opaque JSON — it has no opinion on their shape and
 * validates nothing. Restating them as the ArcGIS types is an assertion, not a conversion:
 * `new Query()` and `new ImageryLayer()` are what actually reject a malformed one, at the
 * point of use. Everything else on a block is derived.
 */
export type ResourceFeature = Omit<
  ResourceBlock<"feature">,
  "query_ai" | "query_chart" | "query_numeric" | "query_table"
> & {
  /** No source row carries one; `getQueryFeatureId` still looks it up by widget type. */
  query_map?: ResourceQuery;
  query_numeric?: ResourceQuery;
  query_table?: ResourceQuery;
  query_chart?: ResourceQuery;
  query_ai?: ResourceQuery;
};

export type ResourceWebTile = ResourceBlock<"web-tile">;

export type ResourceImageryTile = Omit<ResourceBlock<"imagery-tile">, "rasterFunction"> & {
  rasterFunction: __esri.RasterFunctionProperties;
};

export type ResourceImagery = Omit<ResourceBlock<"imagery">, "rasterFunction"> & {
  rasterFunction: __esri.RasterFunctionProperties;
};

export type ResourceH3 = ResourceBlock<"h3">;

export type ResourceComponent = ResourceBlock<"component">;

/**
 * How the AI summary reduces an imagery raster to one number. Authored per indicator rather
 * than derived: `sum` and `mean` are not interchangeable (a population count adds up, a
 * deprivation index does not), and `none` marks the categorical rasters where any scalar
 * would be meaningless — those contribute a class distribution only.
 */
export type ImageryAggregation = ResourceImagery["aggregation"];

/**
 * Three things are restated over the generated Indicator, and only three: the numeric `id`
 * that saved reports and shared URLs hold, the Topic lifted out from under the Subtopic to
 * sit beside it, and the single resource — the CMS models "exactly one" as a one-entry
 * block array, which `lib/cms-content` unwraps.
 */
export type Indicator = Omit<
  CmsIndicator,
  "id" | "resource" | "subtopic" | "visualization_types" | CmsMeta
> & {
  id: number;
  subtopic: Subtopic;
  topic: TopicSummary;
  visualization_types: VisualizationTypes[];
  resource:
    | ResourceFeature
    | ResourceWebTile
    | ResourceImagery
    | ResourceImageryTile
    | ResourceH3
    | ResourceComponent;
};

export type H3Indicator = Indicator & {
  resource: ResourceH3;
};

export type IndicatorOverview = {
  id: number;
  name_es: string;
  name_en: string;
  name_pt: string;
  description_es: string;
  description_en: string;
  description_pt: string;
  description_short_es: string;
  description_short_en: string;
  description_short_pt: string;
  visualization: IndicatorView;
  unit_es: string;
  unit_en: string;
  unit_pt: string;
  topic: number;
  visualization_types: VisualizationTypes[];
  default_visualization_type: Exclude<VisualizationTypes, "ai" | "custom"> | null;
  resource: ResourceFeature | ResourceWebTile | ResourceImageryTile;
};
