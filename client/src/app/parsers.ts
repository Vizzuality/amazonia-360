import { parseAsArrayOf, parseAsString } from "nuqs";

export const layersParser = parseAsArrayOf(parseAsString).withDefault([]);
