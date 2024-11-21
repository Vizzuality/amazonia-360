import { Indicator } from "@/app/parsers";

import { VisualizationType } from "@/containers/report/visualization-types/types";

export type Topic = {
  id: string | number;
  label: string;
  image: string;
  description: string;
  default_visualization: Indicator[];
  indicators?: { label: string; value: string; types_available: VisualizationType[] }[];
};

export type TopicsParsed = {
  id: string | number;
  visible?: boolean;
  indicators: Indicator[] | undefined;
};

export const DEFAULT_VISUALIZATION_SIZES: {
  [key: string]: { w: number; h: number };
} = {
  map: { w: 2, h: 4 },
  chart: { w: 2, h: 1 },
  numeric: { w: 1, h: 1 },
  table: { w: 2, h: 4 },
};

export const MIN_VISUALIZATION_SIZES: {
  [key: string]: { w: number; h: number };
} = {
  map: { w: 2, h: 4 },
  chart: { w: 2, h: 1 },
  numeric: { w: 1, h: 1 },
  table: { w: 2, h: 4 },
};
