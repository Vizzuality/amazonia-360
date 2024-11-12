import {
  parseAsArrayOf,
  parseAsFloat,
  parseAsJson,
  parseAsString,
  parseAsStringLiteral,
} from "nuqs";

import { DATASET_IDS, DatasetIds } from "@/constants/datasets";
import { TOPICS } from "@/constants/topics";

import { VisualizationType } from "@/containers/report/visualization-types/types";

export const datasetsParser = parseAsArrayOf(parseAsStringLiteral(DATASET_IDS)).withDefault([]);

export type TopicsParsed = {
  id: TopicsParserType;
  visible?: boolean;
  indicators: Indicator[] | undefined;
};

export type TopicsParserType = (typeof TOPICS)[number]["id"];

type Indicator = {
  id: DatasetIds | string;
  type: VisualizationType;
  size?: [number, number];
};

export type Indicators = {
  id: TopicsParserType;
  indicators: Indicator[];
};

export const topicsParser = parseAsArrayOf(parseAsJson<Indicators>());

export const bboxParser = parseAsArrayOf(parseAsFloat).withDefault([
  -9502265.057100412, -3312366.5313590243, -3318815.2169444375, 2249803.142895202,
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
