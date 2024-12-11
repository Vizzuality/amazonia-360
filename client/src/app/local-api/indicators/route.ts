import { Topic } from "@/app/local-api/topics/route";
import { IndicatorView } from "@/app/parsers";

import INDICATORS from "./indicators.json";

export type VisualizationType = "map" | "table" | "chart" | "numeric";

export type ResourceFeature = {
  name: string;
  url: string;
  layer_id: number;
  type: "feature";
  query_map: __esri.QueryProperties | null;
  query_table: __esri.QueryProperties | null;
  query_chart: __esri.QueryProperties | null;
  query_numeric: __esri.QueryProperties | null;
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

export type Indicator = {
  id: number;
  name: string;
  description: string;
  topic: {
    id: Topic["id"];
    name: string;
    description: string;
    image: string;
    default_visualization: IndicatorView[];
  };
  visualization_types: VisualizationType[];
  resource: ResourceFeature | ResourceWebTile | ResourceImageryTile;
  h3: string[];
};

export async function GET() {
  return Response.json(INDICATORS as Indicator[]);
}
