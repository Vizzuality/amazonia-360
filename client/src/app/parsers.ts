import { parseAsArrayOf, parseAsStringLiteral } from "nuqs";

import { getKeys } from "@/lib/utils";

import { DATASETS } from "@/constants/datasets";

export const datasetsParser = parseAsArrayOf(
  parseAsStringLiteral(getKeys(DATASETS)),
).withDefault([]);
