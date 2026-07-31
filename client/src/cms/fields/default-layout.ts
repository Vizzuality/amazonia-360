import type { Field } from "payload";

import { VISUALIZATION_TYPE_OPTIONS } from "@/cms/fields/visualization-types";

/**
 * The default arrangement of Indicator tiles for a Topic or Subtopic.
 *
 * The Indicator picker searches **all** Indicators, not only those under this
 * Topic. The overview Topic deliberately pulls Indicators from other Topics, so
 * constraining the picker by Topic would break it.
 */
export const DefaultLayoutField: Field = {
  name: "defaultLayout",
  type: "array",
  labels: { singular: "Tile", plural: "Tiles" },
  admin: {
    description:
      "Indicators shown by default. Any Indicator may be used, including ones belonging to another Topic.",
  },
  fields: [
    {
      name: "indicator",
      type: "relationship",
      relationTo: "indicators",
      required: true,
      admin: {
        description: "Searchable across every Indicator.",
      },
    },
    {
      name: "type",
      type: "select",
      required: true,
      options: VISUALIZATION_TYPE_OPTIONS,
    },
    { name: "x", label: "X", type: "number", required: true },
    { name: "y", label: "Y", type: "number", required: true },
    { name: "w", label: "Width", type: "number", required: true },
    { name: "h", label: "Height", type: "number", required: true },
  ],
};
