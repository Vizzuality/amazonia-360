import type {
  CollectionBeforeChangeHook,
  CollectionBeforeValidateHook,
  CollectionSlug,
  PayloadRequest,
} from "payload";
import { APIError } from "payload";

import { isCatalogueSlug } from "./catalogue-slugs";
import { IMPORT_ROW_ERRORS, type ImportRow, prepareImportRows } from "./prepare-import-rows";

/**
 * Set on `req.context` while the import-export plugin writes catalogue rows. The catalogue
 * is born only by import, so `catalogueAccess.create` lets nothing else through.
 *
 * It reaches the rows' access checks only because catalogue imports run with
 * `disableJobsQueue: true`: the plugin processes the file inside the request that created
 * the import document. Queued, the job gets a fresh `req` and every row is refused.
 */
export const CATALOGUE_IMPORT_CONTEXT = "catalogueImport";

export const isCatalogueImport = (req: Pick<PayloadRequest, "context">) =>
  req.context?.[CATALOGUE_IMPORT_CONTEXT] === true;

/** On the `imports` collection: runs before the plugin's afterChange processes the file. */
export const markCatalogueImport: CollectionBeforeChangeHook = ({ data, operation, req }) => {
  if (operation === "create" && isCatalogueSlug(data?.collectionSlug)) {
    req.context[CATALOGUE_IMPORT_CONTEXT] = true;
  }

  return data;
};

type ImportBatch = { data: ImportRow[]; format: string; req: PayloadRequest };

export const prepareCatalogueImportBatch =
  (slug: CollectionSlug) =>
  async ({ data, format, req }: ImportBatch) => {
    if (format !== "json") {
      throw new APIError(
        "Catalogue imports take JSON only: export the collection as JSON, edit it, and import that file.",
        400,
        null,
        true,
      );
    }

    const ids = data
      .map((row) => row.id)
      .filter((id) => id !== undefined && id !== null && id !== "");
    const { docs } = await req.payload.find({
      collection: slug,
      where: { id: { in: ids.map(String) } },
      locale: "all",
      draft: true,
      depth: 0,
      pagination: false,
      // Not `req`: the Local API writes `locale: "all"` onto the request it is handed, and the
      // plugin goes on to write the batch's rows through that same request.
    });
    const localization = req.payload.config.localization;

    return prepareImportRows(data, {
      fields: req.payload.collections[slug].config.fields,
      locales: localization ? localization.localeCodes : [],
      defaultLocale: localization ? localization.defaultLocale : "en",
      existing: new Map(docs.map((doc) => [String(doc.id), doc as unknown as ImportRow])),
    });
  };

/**
 * The plugin's `before` hook has no way to fail a single row, so it flags the row instead and
 * this fails it at write time, which the plugin records against that row. An APIError keeps
 * the message whole; a ValidationError would reduce it to the names of the fields.
 */
export const rejectInvalidImportRow: CollectionBeforeValidateHook = ({ data, req }) => {
  const errors = data?.[IMPORT_ROW_ERRORS];

  if (isCatalogueImport(req) && Array.isArray(errors)) {
    throw new APIError(errors.join(" "), 400, null, true);
  }

  return data;
};
