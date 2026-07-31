import type { CollectionConfig } from "payload";

import { adminAccess } from "@/cms/access/admin";
import { publishedOrAuthenticatedAccess } from "@/cms/access/published";
import { DefaultLayoutField } from "@/cms/fields/default-layout";
import { requiredInDefaultLocale } from "@/cms/fields/validation";
import { assignNextNumericId } from "@/cms/hooks/next-numeric-id";

/**
 * Top level of the content hierarchy: Topic → Subtopic → Indicator.
 *
 * Ids are the original numeric ones, because saved reports and shared report
 * URLs reference them.
 */
export const Topics: CollectionConfig = {
  slug: "topics",
  admin: {
    useAsTitle: "name",
    defaultColumns: ["id", "name", "_status"],
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
  hooks: {
    beforeValidate: [assignNextNumericId("topics")],
  },
  versions: {
    drafts: true,
  },
};
