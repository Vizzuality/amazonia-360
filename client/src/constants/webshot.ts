import { VisualizationTypes } from "@/types/indicator";

export const WebshotWidgetDefaultSizes: Record<VisualizationTypes, { w: number; h: number }> = {
  ai: {
    w: 4,
    h: 4,
  },
  chart: {
    w: 4,
    h: 4,
  },
  map: {
    w: 4,
    h: 4,
  },
  numeric: {
    w: 2,
    h: 1,
  },
  table: {
    w: 4,
    h: 4,
  },
  custom: {
    w: 4,
    h: 4,
  },
};
