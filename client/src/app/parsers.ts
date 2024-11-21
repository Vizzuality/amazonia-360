import {
  parseAsArrayOf,
  parseAsFloat,
  parseAsJson,
  parseAsString,
  parseAsStringLiteral,
} from "nuqs";

import { DATASET_IDS } from "@/constants/datasets";

import { VisualizationType } from "@/containers/report/visualization-types/types";

export const datasetsParser = parseAsArrayOf(parseAsStringLiteral(DATASET_IDS)).withDefault([]);

export type TopicsParsed = {
  id: string | number;
  visible?: boolean;
  indicators: Indicator[] | undefined;
};

export type Indicator = {
  id: string | number;
  type: VisualizationType;
  w?: number;
  h?: number;
  x?: number;
  y?: number;
};

export type Topics = {
  id: string | number;
  indicators: Indicator[];
};

export const topicsParser = parseAsArrayOf(parseAsJson<Topics>());

export const bboxParser = parseAsArrayOf(parseAsFloat).withDefault([
  -12497583.775253754, -2540944.9326481596, -4391589.799669538, 1362846.9759313238,
]);

export type SearchLocation = {
  type: "search";
} & __esri.SuggestResult;

export type CustomLocation = {
  type: __esri.Geometry["type"];
  geometry: Record<string, unknown>;
};

export type Location = SearchLocation | CustomLocation;
export const locationParser = parseAsJson<Location>();

export const gridFiltersParser = parseAsJson<Record<string, number[]>>();
export const gridDatasetsParser = parseAsArrayOf(parseAsString).withDefault([]);
