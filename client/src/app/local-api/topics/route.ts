import { VisualizationType } from "@/app/local-api/indicators/route";
import { IndicatorView } from "@/app/parsers";

import TOPICS from "./topics.json";

export type TopicIndicator = { name: string; id: number; visualization_types: VisualizationType[] };

export type Topic = {
  id: number;
  name: string;
  image: string;
  description: string;
  default_visualization: IndicatorView[];
  indicators?: TopicIndicator[];
};

export async function GET() {
  return Response.json(TOPICS as Topic[]);
}
