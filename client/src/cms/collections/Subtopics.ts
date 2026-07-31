import type { CollectionConfig } from "payload";

import { adminAccess } from "@/cms/access/admin";
import { publishedOrAuthenticatedAccess } from "@/cms/access/published";
import { DefaultLayoutField } from "@/cms/fields/default-layout";
import { requiredInDefaultLocale } from "@/cms/fields/validation";

export const Subtopics: CollectionConfig = {
  slug: "subtopics",
  admin: {
    useAsTitle: "name",
    defaultColumns: ["name", "topic", "_status"],
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
      name: "topic",
      type: "relationship",
      relationTo: "topics",
      required: true,
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
    DefaultLayoutField,
  ],
  versions: {
    drafts: true,
  },
};
