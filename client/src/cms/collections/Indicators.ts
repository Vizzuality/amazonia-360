import type { CollectionConfig } from "payload";

import { adminAccess } from "@/cms/access/admin";
import { publishedOrAuthenticatedAccess } from "@/cms/access/published";
import { DataSourceField } from "@/cms/fields/data-source";
import { requiredInDefaultLocale } from "@/cms/fields/validation";
import { VISUALIZATION_TYPE_OPTIONS } from "@/cms/fields/visualization-types";
import { assignNextNumericId } from "@/cms/hooks/next-numeric-id";

export const Indicators: CollectionConfig = {
  slug: "indicators",
  admin: {
    useAsTitle: "name",
    defaultColumns: ["id", "name", "subtopic", "_status"],
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
      name: "id",
      type: "number",
      required: true,
      admin: {
        description: "Assigned automatically. Change only to preserve an existing id.",
      },
    },
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
      required: true,
      options: VISUALIZATION_TYPE_OPTIONS,
    },
    DataSourceField,
  ],
  hooks: {
    beforeValidate: [assignNextNumericId("indicators")],
  },
  versions: {
    drafts: true,
  },
};
