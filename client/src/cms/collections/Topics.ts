import type { CollectionConfig, Field } from "payload";

import { adminAccess } from "@/cms/access/admin";
import { publishedOrAdminAccess } from "@/cms/access/catalogue";
import { DefaultVisualizationField } from "@/cms/fields/default-visualization";

/**
 * The numeric id from the original datum JSON.
 *
 * Still an external contract: `cms/fields/topics.ts` stores raw `topic_id` /
 * `indicator_id` numbers on every reports row, and `defaultTopics` is a nuqs URL param
 * (app/(frontend)/store.ts). The reports migration is deliberately out of scope, so this
 * value must never change.
 *
 * Immutability uses field access rather than `admin.readOnly`, which would also block the
 * phase-2 seed from setting it.
 */
export const legacyIdField: Field = {
  name: "legacy_id",
  type: "number",
  required: true,
  unique: true,
  index: true,
  access: { update: () => false },
  admin: {
    description:
      "Numeric id from the original datum JSON. Referenced by existing reports rows and by the defaultTopics URL param. Never change it.",
  },
};

export const catalogueAccess = {
  // Published-only for everyone except admins; see the comment on
  // `publishedOrAdminAccess` for why admins are exempt.
  read: publishedOrAdminAccess,
  create: adminAccess,
  update: adminAccess,
  delete: adminAccess,
};

export const Topics: CollectionConfig = {
  slug: "topics",
  admin: {
    group: "Catalogue",
    useAsTitle: "name",
    defaultColumns: ["legacy_id", "name", "_status"],
  },
  access: catalogueAccess,
  versions: { drafts: true },
  fields: [
    legacyIdField,
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
