import { CmsMeta } from "@/types/cms";
import { Subtopic, TopicSummary } from "@/types/topic";

import { Indicator as CmsIndicator } from "@/payload-types";

export type VisualizationTypes = "map" | "table" | "chart" | "numeric" | "ai" | "custom";

type ResourceQuery = (__esri.QueryProperties & { returnIntersections?: boolean }) | null;

/** No source row carries a `query_map`; `getQueryFeatureId` still looks one up by widget type. */
type FeatureQuery = "query_map" | "query_numeric" | "query_table" | "query_chart" | "query_ai";

type CmsResourceBlock = CmsIndicator["resource"][number];

/**
 * One resource block off the generated Indicator, with the CMS discriminant re-emitted as `type`:
 * Payload's vocabulary stops at `lib/cms-content`. `blockName` and `id` go with it.
 */
type ResourceBlock<TBlock extends CmsResourceBlock["blockType"]> = Omit<
  Extract<CmsResourceBlock, { blockType: TBlock }>,
  "blockName" | "id" | "blockType"
> & { type: TBlock };

/**
 * The CMS stores the ArcGIS objects as opaque JSON. Restating them as the ArcGIS types is an
 * assertion, not a conversion: `new Query()` is what rejects a malformed one, at the point of use.
 */
export type ResourceFeature = Omit<ResourceBlock<"feature">, FeatureQuery | "popupTemplate"> &
  Partial<Record<FeatureQuery, ResourceQuery>> & {
    popupTemplate?: __esri.PopupTemplateProperties;
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
 * How the AI summary reduces an imagery raster to one number. Authored, not derived: a population
 * count adds up, a deprivation index does not, and `none` marks the categorical rasters.
 */
export type ImageryAggregation = ResourceImagery["aggregation"];

/**
 * Restated over the generated Indicator: the numeric `id`, the Topic lifted out from under the
 * Subtopic, the single resource the CMS models as a one-entry block array, and the optional text
 * `lib/cms-content` normalises from `null` to absent.
 */
export type Indicator = Omit<
  CmsIndicator,
  "description" | "id" | "resource" | "subtopic" | "unit" | "visualization_types" | CmsMeta
> & {
  id: number;
  description?: string;
  unit?: string;
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
