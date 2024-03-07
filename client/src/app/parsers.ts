import {
  parseAsArrayOf,
  parseAsFloat,
  parseAsJson,
  parseAsStringLiteral,
} from "nuqs";

import { getKeys } from "@/lib/utils";

import { DATASETS, DatasetIds } from "@/constants/datasets";

export const datasetsParser = parseAsArrayOf(
  parseAsStringLiteral(getKeys(DATASETS)),
).withDefault([]);

export const bboxParser = parseAsArrayOf(parseAsFloat).withDefault([
  -86.72417279662345, -32.612321039385954, -37.944875921636424,
  21.011946256491825,
]);

type FeatureLocation = {
  type: "feature";
  FID: number;
  SOURCE: DatasetIds;
};

type CustomLocation = {
  type: "custom";
  GEOMETRY: string;
};

type Location = FeatureLocation | CustomLocation;
export const locationParser = parseAsJson<Location>();
