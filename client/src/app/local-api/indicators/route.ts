import INDICATORS from "./indicators.json";

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
};

export type Indicator = {
  id: number;
  name: string;
  description: string;
  topic: number;
  visualization_types: VisualizationType[];
  resource: ResourceFeature | ResourceWebTile | ResourceImageryTile;
  h3: H3Indicator[];
};

export async function GET() {
  return Response.json(INDICATORS as Indicator[]);
}
