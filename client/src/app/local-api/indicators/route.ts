import { DatasetMeta } from "@/types/generated/api.schemas";

import { Topic } from "@/app/local-api/topics/route";
import { IndicatorView } from "@/app/parsers";

import INDICATORS from "./indicators_v25_02_2025.json";

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
  name_es: string;
  name_en: string;
  name_pt: string;
  description_es: string;
  description_en: string;
  description_pt: string;
  description_short_es: string;
  description_short_en: string;
  description_short_pt: string;
  unit_es: string;
  unit_en: string;
  unit_pt: string;
  topic: Topic;
  visualization_types: VisualizationType[];
  resource:
    | ResourceFeature
    | ResourceWebTile
    | ResourceImageryTile
    | ResourceH3
    | ResourceComponent;
};

export type H3Indicator = Indicator &
  Pick<DatasetMeta, "var_dtype" | "var_name" | "legend"> & {
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
  visualization_types: VisualizationType[];
  resource: ResourceFeature | ResourceWebTile | ResourceImageryTile;
};

export async function GET() {
  return Response.json(INDICATORS);
}
