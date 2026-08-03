import type { CollectionConfig } from "payload";

import { ResourceField } from "@/cms/fields/resource";
import { warnOnVisualizationMismatch } from "@/cms/hooks/indicator-visualization";

import { catalogueAccess, legacyIdField } from "./Topics";

export const Indicators: CollectionConfig = {
  slug: "indicators",
  admin: {
    group: "Catalogue",
    useAsTitle: "name",
    defaultColumns: ["legacy_id", "name", "subtopic", "_status"],
  },
  access: catalogueAccess,
  versions: { drafts: true },
  fields: [
    legacyIdField,
    {
      name: "order",
      type: "number",
      required: true,
      admin: {
        description:
          "Display order within a subtopic. Not the same as legacy_id — they diverge on some rows.",
      },
    },
    { name: "subtopic", type: "relationship", relationTo: "subtopics", required: true },
    { name: "name", type: "text", localized: true, required: true },
    {
      name: "unit",
      type: "text",
      localized: true,
      admin: { description: "e.g. km², m. Empty on 63 of 164 rows." },
    },
    { name: "description_short", type: "text", localized: true, required: true },
    {
      name: "description",
      type: "textarea",
      localized: true,
      admin: { description: "Markdown. Rendered with react-markdown in containers/info." },
    },
    {
      name: "visualization_types",
      type: "select",
      hasMany: true,
      options: [
        { label: "Map", value: "map" },
        { label: "Table", value: "table" },
        { label: "Chart", value: "chart" },
        { label: "Numeric", value: "numeric" },
      ],
      admin: {
        description:
          "Which widgets this indicator offers. Deliberately explicit, not derived: deriving would change 18 of 164 rows. Empty for all h3 indicators.",
      },
    },
    ResourceField,
  ],
  hooks: {
    beforeChange: [warnOnVisualizationMismatch],
  },
};
