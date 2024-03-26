import {
  parseAsArrayOf,
  parseAsFloat,
  parseAsJson,
  parseAsStringLiteral,
} from "nuqs";

import { getKeys } from "@/lib/utils";

import { DATASETS } from "@/constants/datasets";
import { TOPICS } from "@/constants/topics";

export const datasetsParser = parseAsArrayOf(
  parseAsStringLiteral(getKeys(DATASETS)),
).withDefault([]);

export const topicsParser = parseAsArrayOf(
  parseAsStringLiteral(TOPICS.map((topic) => topic.id)),
);

export const bboxParser = parseAsArrayOf(parseAsFloat).withDefault([
  -85.41285153807887, -34.1915564718903, -29.16285153809382, 18.111690313034348,
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
