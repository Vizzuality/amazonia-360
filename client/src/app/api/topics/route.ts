import { Indicator } from "@/app/parsers";

import { VisualizationType } from "@/containers/report/visualization-types/types";

import topicsData from "./topics.json";

export type Topic = {
  id: string | number;
  label: string;
  image: string;
  description: string;
  default_visualization: Indicator[];
  indicators?: { label: string; value: string; types_available: VisualizationType[] }[];
};

export async function GET() {
  return Response.json(topicsData as Topic[]);
}
