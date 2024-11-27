import { VisualizationType } from "@/app/api/indicators/route";
import { IndicatorView } from "@/app/parsers";

import TOPICS from "./topics2.json";

export type Topic = {
  id: number;
  name: string;
  image: string;
  description: string;
  default_visualization: IndicatorView[];
  indicators?: { name: string; id: number; visualization_types: VisualizationType[] }[];
};

export async function GET() {
  return Response.json(TOPICS as Topic[]);
}
