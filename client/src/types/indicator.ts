import { Subtopic, Topic } from "@/types/topic";

import { IndicatorView } from "@/app/(frontend)/parsers";

import { LegendItemProps } from "@/components/map/legend/item";

export type VisualizationTypes = "map" | "table" | "chart" | "numeric" | "ai" | "custom";

/**
 * How to reduce an imagery raster to one number for the AI summary. Authored per imagery
 * indicator in `datum/indicators.json` rather than derived: `sum` and `mean` are not
 * interchangeable (a population count adds up, a deprivation index does not), and `none` marks
 * the categorical rasters where any scalar would be meaningless — those contribute a class
 * distribution only.
 */
export type ImageryAggregation = "sum" | "mean" | "none";

export type ResourceFeature = {
  name: string;
  url: string;
  layer_id: number;
  type: "feature";
  query_map: (__esri.QueryProperties & { returnIntersections: boolean }) | null;
  query_table: (__esri.QueryProperties & { returnIntersections: boolean }) | null;
  query_chart: (__esri.QueryProperties & { returnIntersections: boolean }) | null;
  query_numeric: (__esri.QueryProperties & { returnIntersections: boolean }) | null;
  query_ai: (__esri.QueryProperties & { returnIntersections: boolean }) | null;
  popupTemplate?: __esri.PopupTemplateProperties;
};

export type ResourceWebTile = {
  name: string;
  url: string;
  type: "web-tile";
};

export type ResourceImageryTile = {
  name: string;
  url: string;
  type: "imagery-tile";
  rasterFunction: __esri.RasterFunctionProperties;
  legend: LegendItemProps;
};

export type ResourceImagery = {
  name: string;
  url: string;
  type: "imagery";
  rasterFunction: __esri.RasterFunctionProperties;
  legend: LegendItemProps;
  aggregation: ImageryAggregation;
};

export type ResourceH3 = {
  id: number;
  name: string;
  description: string;
  column: string;
  type: "h3";
  url?: string;
};

export type ResourceComponent = {
  name: string;
  type: "component";
};

export type Indicator = {
  id: number;
  name?: string;
  name_es: string;
  name_en: string;
  name_pt: string;
  description?: string;
  description_es: string;
  description_en: string;
  description_pt: string;
  description_short?: string;
  description_short_es: string;
  description_short_en: string;
  description_short_pt: string;
  unit?: string;
  unit_es: string;
  unit_en: string;
  unit_pt: string;
  topic: Topic;
  subtopic: Subtopic;
  order: number;
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
  topic: Topic;
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
  resource: ResourceFeature | ResourceWebTile | ResourceImageryTile;
};
