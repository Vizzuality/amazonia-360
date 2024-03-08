import Point from "@arcgis/core/geometry/Point";
import Polygon from "@arcgis/core/geometry/Polygon";
import Polyline from "@arcgis/core/geometry/Polyline";
import {
  parseAsArrayOf,
  parseAsFloat,
  parseAsJson,
  parseAsStringLiteral,
} from "nuqs";

import { getKeys } from "@/lib/utils";

import { DATASETS } from "@/constants/datasets";

export const datasetsParser = parseAsArrayOf(
  parseAsStringLiteral(getKeys(DATASETS)),
).withDefault([]);

export const bboxParser = parseAsArrayOf(parseAsFloat).withDefault([
  -86.72417279662345, -32.612321039385954, -37.944875921636424,
  21.011946256491825,
]);

export type SearchLocation = {
  type: "search";
} & __esri.SuggestResult;

export type CustomLocation = {
  type: "custom";
  GEOMETRY: Point | Polygon | Polyline;
};

export type Location = SearchLocation | CustomLocation;
export const locationParser = parseAsJson<Location>();
