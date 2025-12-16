import { parseAsArrayOf, parseAsFloat, parseAsInteger, parseAsJson, parseAsString } from "nuqs";
import { z } from "zod";

import { VisualizationTypes } from "@/types/indicator";

import { BasemapIds } from "@/constants/basemaps";

type IndicatorViewBase = {
  id: number | string | null;
  indicator_id: number;
  w: number;
  h: number;
  x: number;
  y: number;
};

export type IndicatorMapView = IndicatorViewBase & {
  type: "map";
  basemapId?: BasemapIds;
  opacity?: number;
};

type IndicatorOtherView = IndicatorViewBase & {
  type: Exclude<VisualizationTypes, "map">;
};

export type IndicatorView = IndicatorMapView | IndicatorOtherView;

export type TopicView = {
  id: number | string;
  topic_id: number;
  description?: string;
  indicators?: IndicatorView[];
};

export type SearchLocation = {
  type: "search";
  custom_title?: string;
  key: string | number;
  text: string;
  sourceIndex: number;
};

export type CustomLocation = {
  type: __esri.Geometry["type"];
  geometry: Record<string, unknown>;
  buffer: number;
  custom_title?: string;
};

export type Location = SearchLocation | CustomLocation;

export const bboxParser = parseAsArrayOf(parseAsFloat);

// Indicators
export const indicatorsParser = parseAsArrayOf(parseAsInteger);
export const indicatorsSettingsParser = parseAsJson<Record<number, { opacity?: number }>>(
  z.record(z.number(), z.object({ opacity: z.number().min(0).max(1).optional() })),
).withDefault({});

// Default topics are the ones that are pre-configured in every report
export const defaultTopicsConfigParser = parseAsArrayOf(
  parseAsJson<TopicView>(z.custom<TopicView>()),
).withDefault([
  {
    id: "0",
    topic_id: 0,
    description: undefined,
    indicators: [
      {
        id: "0",
        indicator_id: 0,
        type: "numeric",
        x: 0,
        y: 0,
        w: 1,
        h: 1,
      },
      {
        id: "35",
        indicator_id: 35,
        type: "numeric",
        x: 1,
        y: 0,
        w: 1,
        h: 1,
      },
      {
        id: "11",
        indicator_id: 11,
        type: "numeric",
        x: 2,
        y: 0,
        w: 1,
        h: 1,
      },
      {
        id: "12",
        indicator_id: 12,
        type: "numeric",
        x: 3,
        y: 0,
        w: 1,
        h: 1,
      },
      {
        id: "5",
        indicator_id: 5,
        type: "map",
        x: 0,
        y: 2,
        w: 2,
        h: 4,
      },
      {
        id: "4",
        indicator_id: 4,
        type: "table",
        x: 2,
        y: 2,
        w: 2,
        h: 4,
      },
      {
        id: "2",
        indicator_id: 2,
        type: "numeric",
        x: 0,
        y: 1,
        w: 1,
        h: 1,
      },
      {
        id: "3",
        indicator_id: 3,
        type: "numeric",
        x: 1,
        y: 1,
        w: 1,
        h: 1,
      },
      {
        id: "4",
        indicator_id: 4,
        type: "numeric",
        x: 2,
        y: 1,
        w: 1,
        h: 1,
      },
      {
        id: "5",
        indicator_id: 5,
        type: "numeric",
        x: 3,
        y: 1,
        w: 1,
        h: 1,
      },
    ],
  },
]);

// Grid
export const gridDatasetSelectedParser = parseAsString;
export const gridDatasetsParser = parseAsArrayOf(parseAsString).withDefault([]);
export const gridDatasetSettingsParser = parseAsJson<Record<string, number[] | undefined>>(
  z.record(z.string(), z.array(z.number())),
);
export const gridTableSettingsParser = parseAsJson<{
  [key: string]: number[] | number | string;
  limit: number;
  opacity: number;
  direction: "asc" | "desc";
}>(
  z.object({
    limit: z.number(),
    opacity: z.number().min(0).max(100),
    direction: z.enum(["asc", "desc"]),
  }),
).withDefault({ limit: 10, opacity: 100, direction: "asc" });
