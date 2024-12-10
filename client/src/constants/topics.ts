import { Indicator } from "@/app/api/indicators/route";
import { IndicatorView } from "@/app/parsers";

export type Topic = {
  id: number;
  name: string;
  image: string;
  description: string;
  default_visualization?: IndicatorView[];
  indicators?: Omit<Indicator, "resource" | "h3_grid_column_name" | "topic">[];
};

export const DEFAULT_VISUALIZATION_SIZES: {
  [key: string]: { w: number; h: number };
} = {
  map: { w: 2, h: 4 },
  chart: { w: 2, h: 2 },
  numeric: { w: 1, h: 1 },
  table: { w: 2, h: 4 },
};

export const MIN_VISUALIZATION_SIZES: {
  [key: string]: { w: number; h: number };
} = {
  map: { w: 2, h: 4 },
  chart: { w: 1, h: 1 },
  numeric: { w: 1, h: 1 },
  table: { w: 2, h: 4 },
};
