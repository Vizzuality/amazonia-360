import { IndicatorView } from "@/app/parsers";

import INDICATORS from "./indicators_test_4.json";
// import INDICATORS from "./indicators.json";

export type VisualizationType = "map" | "table" | "chart" | "numeric";

export type ResourceFeature = {
  name: string;
  url: string;
  layer_id: number;
  type: "feature";
  query_map: (__esri.QueryProperties & { returnIntersections: boolean }) | null;
  query_table: (__esri.QueryProperties & { returnIntersections: boolean }) | null;
  query_chart: (__esri.QueryProperties & { returnIntersections: boolean }) | null;
  query_numeric: (__esri.QueryProperties & { returnIntersections: boolean }) | null;
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
};

export type H3Indicator = {
  id: number;
  name: string;
  description: string;
  column: string;
  type: "h3";
  url?: string;
};

export type Indicator = {
  id: number;
  name: string;
  name_es?: string;
  name_en?: string;
  name_pt?: string;
  description?: string;
  description_es?: string;
  description_en?: string;
  description_pt?: string;
  description_short?: string;
  description_short_es?: string;
  description_short_en?: string;
  description_short_pt?: string;
  unit: string;
  unit_es?: string;
  unit_en?: string;
  unit_pt?: string;
  topic: number;
  visualization_types: VisualizationType[];
  resource: ResourceFeature | ResourceWebTile | ResourceImageryTile | H3Indicator;
  h3?: H3Indicator[];
};

export type IndicatorOverview = {
  id: number;
  name: string;
  name_es?: string;
  name_en?: string;
  name_pt?: string;
  description?: string;
  description_es?: string;
  description_en?: string;
  description_pt?: string;
  description_short?: string;
  description_short_es?: string;
  description_short_en?: string;
  description_short_pt?: string;
  visualization: IndicatorView;
  unit: string;
  unit_es?: string;
  unit_en?: string;
  unit_pt?: string;
  topic: number;
  visualization_types: VisualizationType[];
  resource: ResourceFeature | ResourceWebTile | ResourceImageryTile;
};

export async function GET() {
  return Response.json(INDICATORS as Indicator[]);
}
