import type { CollectionConfig } from "payload";

import type { importExportPlugin } from "@payloadcms/plugin-import-export";

import { adminAccess } from "@/cms/access/admin";

import {
  CATALOGUE_SLUGS,
  markCatalogueImport,
  prepareCatalogueImportBatch,
} from "./catalogue-import";

type ImportExportOptions = Parameters<typeof importExportPlugin>[0];

const IMPORT_EXPORT_DOCUMENT_LIMIT = 10000;

const catalogueEntry = (slug: (typeof CATALOGUE_SLUGS)[number]) => ({
  slug,
  // JSON only: the plugin rebuilds a CSV row by splitting every column on `_`, which tears
  // `description_short` and its siblings apart, and a resource block has no flat shape.
  export: {
    format: "json" as const,
    disableJobsQueue: true,
    disableSave: true,
    limit: IMPORT_EXPORT_DOCUMENT_LIMIT,
  },
  import: {
    disableJobsQueue: true,
    limit: IMPORT_EXPORT_DOCUMENT_LIMIT,
    hooks: { before: prepareCatalogueImportBatch(slug) },
  },
});

/**
 * The plugin leaves create and read open to any signed-in user, and the app's users sign in
 * to the same Payload. They could not write the catalogue anyway, but an export would still
 * read whatever their own access allows.
 */
const adminsOnly = (collection: CollectionConfig): CollectionConfig => ({
  ...collection,
  access: { ...collection.access, create: adminAccess, read: adminAccess, delete: adminAccess },
});

export const importExportOptions = {
  overrideExportCollection: ({ collection }) => adminsOnly(collection),
  overrideImportCollection: ({ collection }) => {
    const imports = adminsOnly(collection);

    return {
      ...imports,
      hooks: {
        ...imports.hooks,
        beforeChange: [...(imports.hooks?.beforeChange ?? []), markCatalogueImport],
      },
    };
  },
  collections: [
    {
      slug: "users",
      // The queue is disabled, so each run is serialised inside the request. The plugin
      // defaults to no ceiling, which outlives the request timeout once the table is large
      // enough; a set limit surfaces the plugin's limitExceeded notice in the admin instead.
      // disableSave keeps exports download-only: no storage adapter is configured, so a saved
      // file lands on container-local disk and its url 404s after the next task replacement.
      export: {
        disableJobsQueue: true,
        disableSave: true,
        limit: IMPORT_EXPORT_DOCUMENT_LIMIT,
        // Without a before hook the plugin keeps its schema-derived columns, which for a
        // hasMany field is an always-empty `<name>_0` that re-imports as a junk first entry.
        hooks: { before: ({ data }) => data },
      },
      import: { disableJobsQueue: true, limit: IMPORT_EXPORT_DOCUMENT_LIMIT },
    },
    ...CATALOGUE_SLUGS.map(catalogueEntry),
  ],
} satisfies ImportExportOptions;
