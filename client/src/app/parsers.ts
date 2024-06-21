import {
  parseAsArrayOf,
  parseAsFloat,
  parseAsInteger,
  parseAsJson,
  parseAsStringLiteral,
} from "nuqs";

import { DATASET_IDS } from "@/constants/datasets";
import { TOPICS } from "@/constants/topics";

export const datasetsParser = parseAsArrayOf(
  parseAsStringLiteral(DATASET_IDS),
).withDefault([]);

export const topicsParser = parseAsArrayOf(
  parseAsStringLiteral(TOPICS.map((topic) => topic.id)),
);

export const bboxParser = parseAsArrayOf(parseAsFloat).withDefault([
  -9502265.057100412, -3312366.5313590243, -3318815.2169444375,
  2249803.142895202,
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

export const populationParser = parseAsArrayOf(parseAsInteger).withDefault([
  1, 50000,
]);

export const firesParser = parseAsArrayOf(parseAsInteger).withDefault([
  1, 2, 3, 4, 5, 6,
]);
