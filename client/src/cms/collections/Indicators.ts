import type { CollectionConfig } from "payload";

import { adminAccess } from "@/cms/access/admin";
import { publishedOrAuthenticatedAccess } from "@/cms/access/published";
import { DataSourceField } from "@/cms/fields/data-source";
import { requiredInDefaultLocale } from "@/cms/fields/validation";
import { VISUALIZATION_TYPE_OPTIONS } from "@/cms/fields/visualization-types";

export const Indicators: CollectionConfig = {
  slug: "indicators",
  admin: {
    useAsTitle: "name",
    defaultColumns: ["name", "subtopic", "order", "_status"],
    group: "Content",
  },
  access: {
    read: publishedOrAuthenticatedAccess,
    create: adminAccess,
    update: adminAccess,
    delete: adminAccess,
  },
  fields: [
    {
      name: "subtopic",
      type: "relationship",
      relationTo: "subtopics",
      required: true,
    },
    {
      name: "order",
      type: "number",
      required: true,
      defaultValue: 0,
      admin: {
        description: "Position within the Subtopic.",
      },
    },
    {
      name: "name",
      type: "text",
      localized: true,
      // Required in English only, so untranslated locales stay unset and fall back.
      validate: requiredInDefaultLocale("Name"),
    },
    {
      name: "description",
      type: "richText",
      localized: true,
    },
    {
      name: "descriptionShort",
      label: "Short description",
      type: "textarea",
      localized: true,
    },
    {
      name: "unit",
      type: "text",
      localized: true,
    },
    {
      name: "visualizationTypes",
      type: "select",
      hasMany: true,
      options: VISUALIZATION_TYPE_OPTIONS,
      admin: {
        description:
          "How this Indicator can be rendered. Left empty for H3 grid columns, which are not shown as tiles.",
      },
    },
    DataSourceField,
  ],
  versions: {
    drafts: true,
  },
};
