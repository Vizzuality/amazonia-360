import type { CollectionConfig } from "payload";

import { adminAccess } from "@/cms/access/admin";
import { publishedOrAuthenticatedAccess } from "@/cms/access/published";
import { DefaultLayoutField } from "@/cms/fields/default-layout";
import { requiredInDefaultLocale } from "@/cms/fields/validation";

/**
 * Top level of the content hierarchy: Topic → Subtopic → Indicator.
 *
 * Keyed by uuid like every other collection. Numeric ids are not an option:
 * Payload treats a falsy id as "creating", so *Geographic context* — number 0 in
 * the old catalogue — always opened as a blank create form.
 */
export const Topics: CollectionConfig = {
  slug: "topics",
  admin: {
    useAsTitle: "name",
    defaultColumns: ["name", "_status"],
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
