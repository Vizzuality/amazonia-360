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
  topic_id: number;
  topic_name: string;
  visualization_types: VisualizationType[];
  resource: ResourceFeature | ResourceWebTile | ResourceImageryTile;
  h3_grid_column_name: string | null;
};

export async function GET() {
  return Response.json(INDICATORS as Indicator[]);
}
