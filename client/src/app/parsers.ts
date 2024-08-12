import {
  parseAsArrayOf,
  parseAsFloat,
  parseAsJson,
  parseAsString,
  parseAsStringLiteral,
} from "nuqs";

import { TOPICS } from "@/constants/topics";

export const topicsParser = parseAsArrayOf(parseAsStringLiteral(TOPICS.map((topic) => topic.id)));

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
