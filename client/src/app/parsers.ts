import { parseAsArrayOf, parseAsFloat, parseAsStringLiteral } from "nuqs";

import { getKeys } from "@/lib/utils";

import { DATASETS } from "@/constants/datasets";

export const datasetsParser = parseAsArrayOf(
  parseAsStringLiteral(getKeys(DATASETS)),
).withDefault([]);

export const bboxParser = parseAsArrayOf(parseAsFloat).withDefault([
  -86.72417279662345, -32.612321039385954, -37.944875921636424,
  21.011946256491825,
]);
