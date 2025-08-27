import { IndicatorView } from "@/app/parsers";

export type Topic = {
  id: number;
  name?: string;
  name_es: string;
  name_en: string;
  name_pt: string;
  image: string;
  description?: string;
  description_es: string;
  description_en: string;
  description_pt: string;
  default_visualization: IndicatorView[];
};
