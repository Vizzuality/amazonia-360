import { parseAsArrayOf, parseAsFloat, parseAsInteger, parseAsJson, parseAsString } from "nuqs";
import { z } from "zod";

import { ContextDescriptionType } from "@/types/generated/api.schemas";
import { VisualizationTypes } from "@/types/indicator";

import { BasemapIds } from "@/components/map/controls/basemap";

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

export type SubtopicView = {
  id: number;
  indicators?: IndicatorView[];
};

export type TopicView = {
  id: number;
  subtopics?: SubtopicView[];
};

export type DefaultTopicIndicatorConfig = {
  id: number;
  basemapId?: BasemapIds;
  opacity?: number;
};

export type DefaultTopicConfig = {
  id: number;
  indicators: DefaultTopicIndicatorConfig[];
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
  parseAsJson<DefaultTopicConfig>(
    z.object({
      id: z.number(),
      indicators: z.array(
        z.object({
          id: z.number(),
          basemapId: z.custom<BasemapIds>().optional(),
          opacity: z.number().min(0).max(1).optional(),
        }),
      ),
    }),
  ),
);

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

export const gridDatasetSettingsParser = parseAsJson<Record<string, number[]>>(
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
