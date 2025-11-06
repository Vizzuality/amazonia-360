import {
  createLoader,
  parseAsArrayOf,
  parseAsFloat,
  parseAsInteger,
  parseAsJson,
  parseAsString,
} from "nuqs";
import { z } from "zod";

import { ContextDescriptionType } from "@/types/generated/api.schemas";
import { VisualizationTypes } from "@/types/indicator";

import { BasemapIds } from "@/constants/basemaps";

type IndicatorViewBase = {
  id: number;
  w?: number;
  h?: number;
  x?: number;
  y?: number;
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
  id: number;
  description?: string;
  indicators?: IndicatorView[];
};

export type AiSummary = {
  type?: ContextDescriptionType;
  only_active?: boolean;
  enabled?: boolean;
};

export const topicsParser = parseAsArrayOf(parseAsJson<TopicView>(z.custom<TopicView>()));
export const indicatorsParser = parseAsArrayOf(parseAsInteger);
export const indicatorsSettingsParser = parseAsJson<Record<number, { opacity?: number }>>(
  z.record(z.number(), z.object({ opacity: z.number().min(0).max(1).optional() })),
).withDefault({});

// Default topics are the ones that are pre-configured in every report
export const defaultTopicsConfigParser = parseAsArrayOf(
  parseAsJson<TopicView>(z.custom<TopicView>()),
).withDefault([
  {
    id: 0,
    description: undefined,
    indicators: [
      {
        id: 0,
        type: "numeric",
        x: 0,
        y: 0,
        w: 1,
        h: 1,
      },
      {
        id: 35,
        type: "numeric",
        x: 1,
        y: 0,
        w: 1,
        h: 1,
      },
      {
        id: 11,
        type: "numeric",
        x: 2,
        y: 0,
        w: 1,
        h: 1,
      },
      {
        id: 12,
        type: "numeric",
        x: 3,
        y: 0,
        w: 1,
        h: 1,
      },
      {
        id: 5,
        type: "map",
        x: 0,
        y: 2,
        w: 2,
        h: 4,
      },
      {
        id: 4,
        type: "table",
        x: 2,
        y: 2,
        w: 2,
        h: 4,
      },
      {
        id: 2,
        type: "numeric",
        x: 0,
        y: 1,
        w: 1,
        h: 1,
      },
      {
        id: 3,
        type: "numeric",
        x: 1,
        y: 1,
        w: 1,
        h: 1,
      },
      {
        id: 4,
        type: "numeric",
        x: 2,
        y: 1,
        w: 1,
        h: 1,
      },
      {
        id: 5,
        type: "numeric",
        x: 3,
        y: 1,
        w: 1,
        h: 1,
      },
    ],
  },
]);

export const bboxParser = parseAsArrayOf(parseAsFloat);

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
export const locationParser = parseAsJson<Location>(
  z.discriminatedUnion("type", [
    z.object({
      type: z.literal("search"),
      custom_title: z.string().optional(),
      key: z.union([z.string(), z.number()]),
      text: z.string(),
      sourceIndex: z.number(),
    }),
    z.object({
      type: z.enum(["point", "polyline", "polygon", "extent", "multipoint", "mesh"]),
      geometry: z.record(z.string(), z.unknown()),
      buffer: z.number(),
      custom_title: z.string().optional(),
    }),
  ]),
);

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
export const gridDatasetsParser = parseAsArrayOf(parseAsString).withDefault([]);
export const gridDatasetSelectedParser = parseAsString;

export const aiSummaryParser = parseAsJson<AiSummary>(
  z.object({
    type: z.enum(["Short", "Normal", "Long"]).optional(),
    only_active: z.boolean().optional(),
    enabled: z.boolean().optional(),
  }),
).withDefault({
  type: "Normal",
  only_active: true,
  enabled: false,
});

export const loadResultsSearchParams = createLoader({
  location: locationParser,
  topics: topicsParser,
});
