import { ImageryAggregation, VisualizationTypes } from "@/types/indicator";

import { LegendItemProps } from "@/components/map/legend/item";

/**
 * The wire shapes the three catalogue queries actually return, rather than the generated
 * `payload-types.ts` unions: those describe every depth at once (`string | Subtopic`), which
 * would push a cast into every field the mapper reads. These are narrowed to the depth and
 * `populate` set in `fetch.ts` — change one and the other stops compiling.
 */

export type CmsJson = Record<string, unknown> | unknown[] | string | number | boolean | null;

export type CmsVisualizationEntry = {
  id?: string | null;
  indicator: string;
  type: VisualizationTypes;
  x: number;
  y: number;
  w: number;
  h: number;
  basemapId?: string | null;
  opacity?: number | null;
};

export type CmsTopic = {
  id: string;
  name: string;
  description?: string | null;
  image?: string | null;
  default_visualization?: CmsVisualizationEntry[] | null;
};

export type CmsSubtopic = {
  id: string;
  topic: string;
  name: string;
  description?: string | null;
};

/** The two fields `populate` keeps on the Topic reached through an Indicator's Subtopic. */
export type CmsTopicSummary = Pick<CmsTopic, "id" | "name">;

export type CmsIndicatorSubtopic = {
  id: string;
  topic: CmsTopicSummary;
  name: string;
  description?: string | null;
};

export type CmsPopupTemplate = {
  title?: string | null;
  fieldInfos?: { fieldName: string; label?: string | null }[] | null;
};

export type CmsLegend = {
  type: LegendItemProps["type"];
  items: { id?: string | null; label?: string | null; color: string }[];
};

export type CmsResourceBlock =
  | {
      blockType: "feature";
      name?: string | null;
      url: string;
      layer_id: string;
      popupTemplate?: CmsPopupTemplate | null;
      query_numeric?: CmsJson;
      query_table?: CmsJson;
      query_chart?: CmsJson;
      query_ai?: CmsJson;
    }
  | {
      blockType: "imagery";
      name?: string | null;
      url: string;
      rasterFunction: CmsJson;
      legend: CmsLegend;
      aggregation: ImageryAggregation;
    }
  | {
      blockType: "imagery-tile";
      name?: string | null;
      url: string;
      rasterFunction: CmsJson;
      legend: CmsLegend;
    }
  | { blockType: "web-tile"; name?: string | null; url: string }
  | { blockType: "h3"; name: string; column: string; url?: string | null }
  | { blockType: "component"; name: string; query_ai?: CmsJson };

export type CmsIndicator = {
  id: string;
  order: number;
  subtopic: CmsIndicatorSubtopic;
  name: string;
  unit?: string | null;
  description_short: string;
  description?: string | null;
  visualization_types?: Exclude<VisualizationTypes, "ai" | "custom">[] | null;
  default_visualization_type?: Exclude<VisualizationTypes, "ai" | "custom"> | null;
  resource: CmsResourceBlock[];
};
