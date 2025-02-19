import { Indicator } from "@/app/local-api/indicators/route";
import { IndicatorView } from "@/app/parsers";

import TOPICS from "./topics_v17_02_2025.json";

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
  indicators?: Indicator[];
};

export async function GET() {
  return Response.json(TOPICS as Topic[]);
}
