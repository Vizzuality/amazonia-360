import { VisualizationType } from "@/app/local-api/indicators/route";
import { IndicatorView } from "@/app/parsers";

import TOPICS from "./topics.json";

export type TopicIndicator = {
  name: string;
  id: number;
  visualization_types: VisualizationType[];
  description: string;
  description_short: string;
};

export type Topic = {
  id: number;
  name: string;
  name_es?: string;
  name_en?: string;
  name_pt?: string;
  image: string;
  description: string;
  description_es?: string;
  description_en?: string;
  description_pt?: string;
  description_short: string;
  description_short_es?: string;
  description_short_en?: string;
  description_short_pt?: string;
  default_visualization: IndicatorView[];
  indicators?: TopicIndicator[];
};

export async function GET() {
  return Response.json(TOPICS as Topic[]);
}
