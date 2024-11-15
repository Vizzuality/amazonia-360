import INDICATORS from "./indicators.json";

export type VisualizationType = "map" | "table" | "chart" | "numeric";

export type Indicator = {
  id: number;
  name: string;
  topic_id: number;
  topic_name: string;
  resource_name: string;
  resource_url: string;
  resource_type: "feature" | "web-tile" | "imagery-tile";
  resource_query_map: __esri.QueryProperties | null;
  resource_query_table: __esri.QueryProperties | null;
  resource_query_chart: __esri.QueryProperties | null;
  resource_query_numeric: __esri.QueryProperties | null;
  visualization_types: VisualizationType[];
  h3_grid_column_name: string | null;
};

export async function GET() {
  return Response.json(INDICATORS as Indicator[]);
}
