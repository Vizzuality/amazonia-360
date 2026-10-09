import type { CollectionConfig } from "payload";

import { adminAccess } from "@/cms/access/admin";
import { anyoneAccess } from "@/cms/access/anyone";

export const Partners: CollectionConfig = {
  slug: "partners",
  admin: {
    group: "Country modules",
    useAsTitle: "name",
    defaultColumns: ["name", "label", "regional", "modules", "order"],
  },
  access: {
    read: anyoneAccess,
    create: adminAccess,
    update: adminAccess,
    delete: adminAccess,
  },
  fields: [
    { name: "name", type: "text", required: true },
    {
      name: "label",
      type: "text",
      admin: {
        description:
          "Short name shown under the logo on the partners page, e.g. MAE. Leave empty to show no caption.",
      },
    },
    {
      name: "tag",
      type: "text",
      maxLength: 4,
      admin: { description: "Up to 4 letters. Reserved for the badge next to indicators." },
    },
    {
      name: "logo",
      type: "text",
      required: true,
      localized: true,
      admin: { description: "Path under client/public, e.g. /partners/esri.avif" },
    },
    {
      name: "logoSize",
      type: "select",
      defaultValue: "default",
      options: [
        { label: "Default", value: "default" },
        { label: "Large", value: "large" },
      ],
    },
    {
      name: "regional",
      type: "checkbox",
      defaultValue: false,
      admin: {
        description:
          "Shown among the Amazon Region partners. Independent of modules: a partner can be regional and belong to modules too.",
      },
    },
    { name: "modules", type: "relationship", relationTo: "country-modules", hasMany: true },
    { name: "order", type: "number", required: true, defaultValue: 0 },
  ],
};
