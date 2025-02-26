import { IndicatorView } from "@/app/parsers";

import TOPICS from "./topics.json";

export type Topic = {
  id: number;
  name_es: string;
  name_en: string;
  name_pt: string;
  image: string;
  description_es: string;
  description_en: string;
  description_pt: string;
  default_visualization: IndicatorView[];
};

export async function GET() {
  return Response.json(TOPICS as Topic[]);
}
