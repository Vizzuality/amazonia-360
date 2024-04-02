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
  -9539948.512044987, -3484407.1727718394, -3278227.154925013,
  2361496.7504768865,
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
