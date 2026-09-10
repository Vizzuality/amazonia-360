import type { CollectionConfig } from "payload";

import { catalogueAccess } from "@/cms/access/catalogue";
import { DefaultVisualizationField } from "@/cms/fields/default-visualization";
import { sourceIdField } from "@/cms/fields/source-id";
import { autoIncrementSourceId } from "@/cms/hooks/auto-increment-source-id";

export const Subtopics: CollectionConfig = {
  slug: "subtopics",
  admin: {
    group: "Catalogue",
    useAsTitle: "name",
    defaultColumns: ["id", "name", "topic", "_status"],
  },
  access: catalogueAccess,
  versions: { drafts: true },
  hooks: {
    beforeValidate: [autoIncrementSourceId],
  },
  fields: [
    sourceIdField,
    { name: "topic", type: "relationship", relationTo: "topics", required: true },
    {
      name: "name",
      type: "text",
      localized: true,
      // Required by contract. Payload validates `required` against the request locale, so
      // seeding English-only content still succeeds and reads fall back to en. The ES/PT
      // tabs will refuse to save until phase 2 seeds the 28 translations — by design.
      required: true,
      admin: {
        description:
          "English only in the source data. ES and PT translations are seeded in phase 2; reads fall back to en until then.",
      },
    },
    {
      name: "description",
      type: "textarea",
      localized: true,
      admin: { description: "Markdown. Empty on every row in the source data." },
    },
    DefaultVisualizationField,
  ],
};
