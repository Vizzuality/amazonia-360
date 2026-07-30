import { Subtopic, Topic } from "@/types/topic";

import { LegendItemProps } from "@/components/map/legend/item";

export type VisualizationTypes = "map" | "table" | "chart" | "numeric" | "ai" | "custom";

export type ResourceFeature = {
  name: string;
  url: string;
  layer_id: number;
  type: "feature";
  query_table: (__esri.QueryProperties & { returnIntersections: boolean }) | null;
  query_chart: (__esri.QueryProperties & { returnIntersections: boolean }) | null;
  query_numeric: (__esri.QueryProperties & { returnIntersections: boolean }) | null;
  query_ai: (__esri.QueryProperties & { returnIntersections: boolean }) | null;
  popupTemplate?: __esri.PopupTemplateProperties;
};

export type ResourceImagery = {
  name: string;
  url: string;
  type: "imagery";
  rasterFunction: __esri.RasterFunctionProperties;
  legend: LegendItemProps;
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
  resource: ResourceFeature | ResourceImagery | ResourceH3 | ResourceComponent;
};

export type H3Indicator = Indicator & {
  resource: ResourceH3;
  topic: Topic;
};
