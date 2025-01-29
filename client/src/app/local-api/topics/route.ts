import { VisualizationType } from "@/app/local-api/indicators/route";
import { IndicatorView } from "@/app/parsers";

// import TOPICS from "./topics.json";
import TOPICS from "./topics.test3.json";

export type TopicIndicator = {
  name: string;
  id: number;
  visualization_types: VisualizationType[];
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
  default_visualization: IndicatorView[];
  indicators?: TopicIndicator[];
};

export async function GET() {
  return Response.json(TOPICS as Topic[]);
}
