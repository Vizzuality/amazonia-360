import {
  getPayload,
  type Payload,
  type PayloadRequest,
  type RequiredDataFromCollectionSlug,
} from "payload";

import config from "@payload-config";

import { describeAppliedFixes } from "@/cms/seed/fixes";
import { mapDefaultVisualization } from "@/cms/seed/map-default-visualization";
import { mapIndicatorBase, mapIndicatorLocale } from "@/cms/seed/map-indicator";
import { mapSubtopicBase, mapSubtopicLocale } from "@/cms/seed/map-subtopic";
import { mapTopicBase, mapTopicLocale } from "@/cms/seed/map-topic";
import {
  rawIndicators,
  rawSubtopics,
  rawTopics,
  TRANSLATION_LOCALES,
  type Locale,
} from "@/cms/seed/source";

type CatalogueSlug = "topics" | "subtopics" | "indicators";

/**
 * Fields copied from the `en` write into each translation write.
 *
 * Payload validates the *whole* document against the request locale on every update, and two
 * subfields inside the indicator `resource` blocks — `popupTemplate.fieldInfos[].label` and
 * `legend.items[].label` — are both `localized` and `required`. The block rows themselves are
 * not localized, so they survive the `en` write, but their `label` values are empty in `es`
 * and `pt`; a translation update that omits `resource` therefore fails validation on the 45
 * indicators carrying popup field infos and the 27 carrying legend items.
 *
 * The source data has a single language for those labels — there is no `label_es`/`label_pt`
 * anywhere in `datum/indicators.json` — so the blocks are sent back exactly as the `en` write
 * returned them, ids included. That is what the admin UI itself does when a locale tab is
 * saved, and it seeds the untranslated labels with the English text that locale fallback was
 * already showing readers.
 */
const CARRIED_TO_TRANSLATIONS: Partial<Record<CatalogueSlug, readonly string[]>> = {
  indicators: ["resource"],
};

const args = new Set(process.argv.slice(2));
const dryRun = args.has("--dry-run");
const overwrite = args.has("--overwrite");

/** Documents this run created, per collection — pass 4 only backfills these. */
const created = {
  topics: new Set<number>(),
  subtopics: new Set<number>(),
  indicators: new Set<number>(),
};
const counts = {
  topics: { created: 0, updated: 0, skipped: 0 },
  subtopics: { created: 0, updated: 0, skipped: 0 },
  indicators: { created: 0, updated: 0, skipped: 0 },
};

async function findByLegacyId(
  payload: Payload,
  collection: CatalogueSlug,
  legacyId: number,
  req: Partial<PayloadRequest>,
): Promise<string | undefined> {
  const { docs } = await payload.find({
    collection,
    where: { legacy_id: { equals: legacyId } },
    limit: 1,
    depth: 0,
    pagination: false,
    draft: true,
    req,
  });
  return docs[0]?.id as string | undefined;
}

/**
 * Writes one document as published in `en`, then translates it. Returns the document id — the
 * newly created/updated id, or the existing id when an existing row is left alone in
 * create-only mode.
 */
async function upsert<TSlug extends CatalogueSlug>(
  payload: Payload,
  collection: TSlug,
  legacyId: number,
  base: RequiredDataFromCollectionSlug<TSlug>,
  locales: Partial<Record<Locale, Record<string, unknown>>>,
  req: Partial<PayloadRequest>,
): Promise<string | undefined> {
  const existing = await findByLegacyId(payload, collection, legacyId, req);

  if (existing && !overwrite) {
    counts[collection].skipped += 1;
    return existing;
  }

  // `_status` is not localized: setting it once on the `en` write is enough. `draft: false`
  // alone does not publish — versions.drafts defaults `_status` to `draft` on create, and
  // nothing else on the create path sets it to `published` unless localizeStatus is enabled
  // (it is not, here).
  const publishedBase = { ...base, _status: "published" as const };

  let written: Record<string, unknown>;
  if (existing) {
    // `payload.update`'s data type is `DeepPartial<MarkOptional<DataFromCollectionSlug<TSlug>, ...>>`,
    // composed through nested generics. TypeScript cannot prove that composition assignable while
    // `TSlug` is still abstract, even though it holds for every concrete slug — the identical
    // assignment typechecks once the collection slug is a literal, and only the
    // generic-through-generic case fails. `payload.create` right below has no such issue and
    // typechecks `publishedBase` against the real collection shape with no cast, which is what
    // actually catches a mapper/collection mismatch; this cast only works around the `update`
    // composition, not a real mismatch.
    written = (await payload.update({
      collection,
      id: existing,
      data: publishedBase as never,
      locale: "en",
      draft: false,
      depth: 0,
      req,
    })) as Record<string, unknown>;
    counts[collection].updated += 1;
  } else {
    written = (await payload.create({
      collection,
      data: publishedBase,
      locale: "en",
      draft: false,
      depth: 0,
      req,
    })) as Record<string, unknown>;
    counts[collection].created += 1;
    created[collection].add(legacyId);
  }
  const id = written.id as string;

  const carried = Object.fromEntries(
    (CARRIED_TO_TRANSLATIONS[collection] ?? []).map((field) => [field, written[field]]),
  );

  for (const locale of TRANSLATION_LOCALES) {
    const data = locales[locale];
    if (!data || Object.keys(data).length === 0) continue;
    // Same `update` generic-composition limitation as above.
    await payload.update({
      collection,
      id,
      data: { ...carried, ...data } as never,
      locale,
      draft: false,
      depth: 0,
      req,
    });
  }

  return id;
}

/** Reads every legacy_id -> uuid pair from the database, so partial states still resolve. */
async function idMap(
  payload: Payload,
  collection: CatalogueSlug,
  req: Partial<PayloadRequest>,
): Promise<Map<number, string>> {
  const { docs } = await payload.find({
    collection,
    limit: 0,
    pagination: false,
    depth: 0,
    draft: true,
    req,
  });
  return new Map(
    docs.filter((d) => d.legacy_id != null).map((d) => [d.legacy_id as number, d.id as string]),
  );
}

async function seed(payload: Payload, req: Partial<PayloadRequest>) {
  // Pass 1 — topics, without default_visualization
  for (const row of rawTopics) {
    await upsert(
      payload,
      "topics",
      row.id,
      mapTopicBase(row),
      { es: mapTopicLocale(row, "es"), pt: mapTopicLocale(row, "pt") },
      req,
    );
  }
  console.log(`  topics      ${summary("topics")}`);

  // Pass 2 — subtopics
  const topicIds = await idMap(payload, "topics", req);
  for (const row of rawSubtopics) {
    await upsert(
      payload,
      "subtopics",
      row.id,
      mapSubtopicBase(row, topicIds),
      { es: mapSubtopicLocale(row, "es"), pt: mapSubtopicLocale(row, "pt") },
      req,
    );
  }
  console.log(`  subtopics   ${summary("subtopics")}`);

  // Pass 3 — indicators
  const subtopicIds = await idMap(payload, "subtopics", req);
  for (const row of rawIndicators) {
    await upsert(
      payload,
      "indicators",
      row.id,
      mapIndicatorBase(row, subtopicIds),
      { es: mapIndicatorLocale(row, "es"), pt: mapIndicatorLocale(row, "pt") },
      req,
    );
  }
  console.log(`  indicators  ${summary("indicators")}`);

  // Pass 4 — backfill default_visualization
  const indicatorIds = await idMap(payload, "indicators", req);
  let backfilled = 0;

  for (const [collection, rows] of [
    ["topics", rawTopics],
    ["subtopics", rawSubtopics],
  ] as const) {
    const ids = collection === "topics" ? topicIds : await idMap(payload, collection, req);

    for (const row of rows) {
      if (!row.default_visualization?.length) continue;
      if (!overwrite && !created[collection].has(row.id)) continue;

      const id = ids.get(row.id) ?? (await findByLegacyId(payload, collection, row.id, req));
      if (!id) continue;

      const { entries, skipped } = mapDefaultVisualization(
        row.default_visualization,
        row.id,
        indicatorIds,
      );
      for (const missing of skipped) {
        console.warn(
          `  ⚠ skipped  ${collection} legacy_id=${row.id} default_visualization -> indicator ${missing} not found`,
        );
      }

      await payload.update({
        collection,
        id,
        data: { default_visualization: entries },
        locale: "en",
        draft: false,
        req,
      });
      backfilled += 1;
    }
  }
  console.log(`  backfill    default_visualization on ${backfilled} documents`);
}

function summary(collection: CatalogueSlug): string {
  const c = counts[collection];
  return `+${c.created} created  ~${c.updated} updated  ○${c.skipped} skipped`;
}

async function main() {
  const payload = await getPayload({ config });
  const mode = overwrite ? "overwrite" : "create-only";
  console.log(`\nSeeding catalogue (${mode}${dryRun ? ", dry run" : ""})\n`);

  for (const fix of describeAppliedFixes()) {
    console.log(`  ⚙ fix       ${fix.collection} legacy_id=${fix.legacy_id}  ${fix.change}`);
  }

  const transactionID = await payload.db.beginTransaction();
  if (!transactionID) throw new Error("could not begin a database transaction");
  const req: Partial<PayloadRequest> = { transactionID };

  try {
    try {
      await seed(payload, req);
    } catch (error) {
      try {
        await payload.db.rollbackTransaction(transactionID);
      } catch (rollbackError) {
        console.error("\n  ❌ rollback also failed:", rollbackError);
      }
      // Always rethrow the original error — it carries the mapper's row-naming diagnostic,
      // which matters far more than a rollback failure.
      throw error;
    }

    if (dryRun) {
      await payload.db.rollbackTransaction(transactionID);
      console.log("\n  ↩ dry run — transaction rolled back, nothing persisted\n");
    } else {
      await payload.db.commitTransaction(transactionID);
      console.log("\n  ✅ committed\n");
    }
  } finally {
    // Swallowed on purpose: a `destroy` rejection thrown from `finally` would replace the
    // original error and lose the mapper's row-naming diagnostic.
    await payload.destroy().catch((e) => console.error("  destroy failed:", e));
  }
}

await main().catch((error) => {
  console.error("\n  ❌ seed failed:", error);
  process.exit(1);
});
