import type { CollectionConfig } from "payload";

import { catalogueAccess } from "@/cms/access/catalogue";
import { DefaultVisualizationField } from "@/cms/fields/default-visualization";
import { sourceIdField } from "@/cms/fields/source-id";
import { autoIncrementSourceId } from "@/cms/hooks/auto-increment-source-id";

export const Topics: CollectionConfig = {
  slug: "topics",
  admin: {
    group: "Catalogue",
    useAsTitle: "name",
    defaultColumns: ["id", "name", "_status"],
  },
  access: catalogueAccess,
  versions: { drafts: true },
  hooks: {
    beforeValidate: [autoIncrementSourceId],
  },
  fields: [
    sourceIdField,
    { name: "name", type: "text", localized: true, required: true },
    {
      name: "description",
      type: "textarea",
      localized: true,
      admin: { description: "Markdown. Rendered with react-markdown." },
    },
    {
      name: "image",
      type: "text",
      admin: { description: "Path under client/public, e.g. /images/topics/territory.webp" },
    },
    DefaultVisualizationField,
  ],
};
