import { parseAsArrayOf, parseAsFloat, parseAsJson, parseAsString } from "nuqs";

import { ContextDescriptionType } from "@/types/generated/api.schemas";

import { VisualizationTypes } from "./local-api/indicators/route";

export type IndicatorView = {
  id: number;
  type: VisualizationTypes;
  w?: number;
  h?: number;
  x?: number;
  y?: number;
};

export type TopicView = {
  id: number;
  indicators: IndicatorView[] | undefined;
};

export type AiSummary = {
  type?: ContextDescriptionType;
  only_active?: boolean;
  enabled?: boolean;
};

export const topicsParser = parseAsArrayOf(parseAsJson<TopicView>());

export const bboxParser = parseAsArrayOf(parseAsFloat).withDefault([
  -12497583.775253754, -2540944.9326481596, -4391589.799669538, 1362846.9759313238,
]);

export type SearchLocation = {
  type: "search";
} & __esri.SuggestResult;

export type CustomLocation = {
  type: __esri.Geometry["type"];
  geometry: Record<string, unknown>;
  buffer: number;
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
