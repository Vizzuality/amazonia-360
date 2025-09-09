import { parseAsArrayOf, parseAsFloat, parseAsInteger, parseAsJson, parseAsString } from "nuqs";

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

export type TopicView = {
  id: number;
  indicators: IndicatorView[] | undefined;
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

export const topicsParser = parseAsArrayOf(parseAsJson<TopicView>());
export const indicatorsParser = parseAsArrayOf(parseAsInteger);

// Default topics are the ones that are pre-configured in every report
export const defaultTopicsConfigParser = parseAsArrayOf(parseAsJson<DefaultTopicConfig>());

export const bboxParser = parseAsArrayOf(parseAsFloat);

export type SearchLocation = {
  type: "search";
  custom_title?: string;
} & __esri.SuggestResult;

export type CustomLocation = {
  type: __esri.Geometry["type"];
  geometry: Record<string, unknown>;
  buffer: number;
  custom_title?: string;
};

export type Location = SearchLocation | CustomLocation;
export const locationParser = parseAsJson<Location>();

export const gridFiltersParser = parseAsJson<Record<string, number[]>>();
export const gridFiltersSetUpParser = parseAsJson<{
  [key: string]: number[] | number | string;
  limit: number;
  opacity: number;
  direction: "asc" | "desc";
}>().withDefault({ limit: 10, opacity: 100, direction: "desc" });
export const gridDatasetsParser = parseAsArrayOf(parseAsString).withDefault([]);
export const gridDatasetSelectedParser = parseAsString;

export const aiSummaryParser = parseAsJson<AiSummary>().withDefault({
  type: "Normal",
  only_active: true,
  enabled: false,
});
