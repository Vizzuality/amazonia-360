import { APIError } from "payload";
import type {
  CollectionBeforeDeleteHook,
  CollectionConfig,
  PayloadRequest,
  TextFieldSingleValidation,
} from "payload";

import { text } from "payload/shared";

import { COUNTRIES } from "@/constants/countries";

import { activeOrAdminAccess } from "@/cms/access/active";
import { adminAccess } from "@/cms/access/admin";
import { routing } from "@/i18n/routing";

const SLUG_PATTERN = /^[A-Za-z0-9-]+$/;

const RESERVED_SLUGS: readonly string[] = [
  ...routing.locales,
  "auth",
  "partners",
  "reports",
  "private",
  "webshot",
  "admin",
  "api",
  "v1",
  "local-api",
];

async function hasCaseInsensitiveDuplicate(
  slug: string,
  id: number | string | undefined,
  req: PayloadRequest,
): Promise<boolean> {
  const { docs } = await req.payload.find({
    collection: "country-modules",
    where: { slug: { like: slug } },
    select: { slug: true },
    depth: 0,
    pagination: false,
    req,
  });

  return docs.some((doc) => doc.id !== id && doc.slug.toLowerCase() === slug.toLowerCase());
}

const validateSlug: TextFieldSingleValidation = async (value, options) => {
  if (typeof value === "string" && value !== "") {
    if (!SLUG_PATTERN.test(value)) return "Use only letters, numbers and hyphens.";
    if (RESERVED_SLUGS.includes(value.toLowerCase())) {
      return `"${value}" is a reserved path and cannot be used as a slug.`;
    }
    if (await hasCaseInsensitiveDuplicate(value, options.id, options.req)) {
      return `Another module already uses "${value}" (letter case is ignored).`;
    }
  }

  return text(value, options);
};

const preventDeleteWithIndicators: CollectionBeforeDeleteHook = async ({ id, req }) => {
  const [published, drafts] = await Promise.all([
    req.payload.count({ collection: "indicators", where: { module: { equals: id } }, req }),
    req.payload.countVersions({
      collection: "indicators",
      where: { and: [{ latest: { equals: true } }, { "version.module": { equals: id } }] },
      req,
    }),
  ]);

  if (published.totalDocs + drafts.totalDocs > 0) {
    throw new APIError(
      "This module still has indicators. Deactivate it, or move its indicators to another module, before deleting it.",
      400,
      null,
      true,
    );
  }
};

export const CountryModules: CollectionConfig = {
  slug: "country-modules",
  admin: {
    group: "Country modules",
    useAsTitle: "moduleName",
    defaultColumns: ["slug", "moduleName", "country", "active", "order"],
  },
  hooks: {
    beforeDelete: [preventDeleteWithIndicators],
  },
  access: {
    read: activeOrAdminAccess,
    create: adminAccess,
    update: adminAccess,
    delete: adminAccess,
  },
  fields: [
    {
      name: "slug",
      type: "text",
      required: true,
      unique: true,
      validate: validateSlug,
      admin: {
        description:
          "The URL segment of this module, e.g. ECU in /en/ECU/reports. Letters, numbers and hyphens only. Must never equal a page path (reports, partners, auth…) or a locale.",
      },
    },
    {
      name: "country",
      type: "select",
      required: true,
      options: COUNTRIES.map(({ iso3, name }) => ({ label: name, value: iso3 })),
      admin: { description: "The country used for the flag and the map boundary." },
    },
    {
      name: "active",
      type: "checkbox",
      defaultValue: false,
      admin: {
        description: "Inactive modules are hidden from the site and their URLs return 404.",
      },
    },
    { name: "name", type: "text", localized: true, required: true },
    { name: "moduleName", type: "text", localized: true, required: true },
    {
      name: "partnersDescription",
      type: "textarea",
      localized: true,
      admin: {
        description: "Shown on the partners page tab. Plain text; each line is a paragraph.",
      },
    },
    {
      name: "tag",
      type: "text",
      required: true,
      maxLength: 4,
      admin: { description: "Short badge, e.g. ECU." },
    },
    {
      name: "bbox",
      type: "group",
      admin: { description: "Initial map extent in Web Mercator (EPSG:3857). Optional." },
      fields: [
        {
          type: "row",
          fields: [
            { name: "xmin", type: "number" },
            { name: "ymin", type: "number" },
            { name: "xmax", type: "number" },
            { name: "ymax", type: "number" },
          ],
        },
      ],
    },
    { name: "order", type: "number", required: true, defaultValue: 0 },
    {
      name: "partners",
      type: "join",
      collection: "partners",
      on: "modules",
      defaultSort: "order",
      defaultLimit: 100,
      admin: { description: "Partners of this module. Edited on the partner itself." },
    },
    {
      name: "indicators",
      type: "join",
      collection: "indicators",
      on: "module",
      defaultSort: "order",
      defaultLimit: 500,
      admin: {
        defaultColumns: ["id", "name", "_status"],
        description: "Indicators of this module. Edited on the indicator itself.",
      },
    },
  ],
};
