import {
  parseAsArrayOf,
  parseAsFloat,
  parseAsJson,
  parseAsString,
  parseAsStringLiteral,
} from "nuqs";

import { TOPICS } from "@/constants/topics";

import { VisualizationType } from "@/containers/report/visualization-types/types";

export const topicsParser = parseAsArrayOf(parseAsStringLiteral(TOPICS.map((topic) => topic.id)));

export const datasetsParser = parseAsArrayOf(parseAsStringLiteral(DATASET_IDS)).withDefault([]);

export type TopicsParserType = (typeof TOPICS)[number]["id"];

type Indicator = {
  id: string;
  type: VisualizationType;
  size: [number, number];
};

export type Indicators = {
  id: TopicsParserType;
  indicators: Indicator[];
};

export const indicatorsParser = parseAsArrayOf(parseAsJson<Indicators>());

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
