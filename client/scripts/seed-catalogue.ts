/**
 * Writes `client/datum/{topics,subtopics,indicators}.json` into the topics/subtopics/indicators
 * CMS collections as published, multi-locale documents. This is the write path — see
 * `scripts/verify-catalogue.ts` for the read-only audit that should follow every run.
 *
 * ⚠ Always invoke this through `pnpm seed:catalogue`, never `payload run
 * scripts/seed-catalogue.ts` directly.
 *
 * `client/package.json`'s `seed:catalogue` script is `payload run scripts/seed-catalogue.ts --`.
 * That trailing `--` is not decorative — it is the entire reason flags below reach this file at
 * all. `payload run` parses its own CLI invocation with `minimist` and then rebuilds
 * `process.argv` from `minimist`'s *positional* arguments (`args._`) only, dropping everything
 * `minimist` consumed as a named option. Without the `--`, minimist parses a flag like
 * `--dry-run` as `{ 'dry-run': true }` — a named option, not a positional — so it never appears
 * in `args._` and is silently discarded before this script's own `process.argv` is rebuilt.
 * Concretely:
 *
 *   payload run scripts/seed-catalogue.ts --dry-run     — `--dry-run` is dropped; this runs
 *                                                          as a REAL, COMMITTED write
 *   payload run scripts/seed-catalogue.ts -- --dry-run  — `--dry-run` survives as a literal
 *                                                          positional and reaches this file
 *
 * The obvious moves that skip the `--` — running `payload run scripts/seed-catalogue.ts
 * --dry-run` directly while debugging, or invoking it in a container without the pnpm scripts —
 * both silently commit. Always go through `pnpm seed:catalogue -- <flags>`.
 *
 *   pnpm seed:catalogue -- --dry-run                — rehearse: build everything, roll back
 *   pnpm seed:catalogue -- --overwrite --yes         — also rewrite existing rows (destructive
 *                                                       to translated labels — see the
 *                                                       CARRIED_TO_TRANSLATIONS comment below)
 *
 * As a second line of defence, unknown flags (`--dryrun`, `--dry_run`, `-n`, `--overwite`, …)
 * are rejected before any database connection opens rather than silently ignored — see
 * KNOWN_FLAGS below.
 */
import {
  getPayload,
  type Payload,
  type PayloadRequest,
  type RequiredDataFromCollectionSlug,
} from "payload";

import config from "@payload-config";

import { env } from "@/env.mjs";

import { buildTranslationData } from "@/cms/seed/carry-translations";
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
import { getDatabaseUrlFromUrlAndPassword } from "@/utils/database-url";

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
 *
 * ⚠ This is destructive under `--overwrite`. The carried block always holds the English
 * labels, and nothing here can tell an editor's hand-typed Spanish label from one that was
 * never translated — `mapIndicatorLocale` does not return `resource`, so there is no
 * per-locale value to compare against. A `--overwrite` run against a catalogue whose
 * `popupTemplate.fieldInfos[].label` or `legend.items[].label` have been translated in the
 * admin UI will silently reset every one of them to English. Read the note on `overwrite`
 * below before reaching for that flag on a live catalogue.
 */
const CARRIED_TO_TRANSLATIONS: Partial<Record<CatalogueSlug, readonly string[]>> = {
  indicators: ["resource"],
};

/**
 * Every flag this script understands. Anything else on the command line — a typo like
 * `--dryrun`/`--dry_run`/`-n`/`--overwite`, or a flag from a different script entirely — throws
 * immediately rather than being silently ignored. This is the same failure class as the
 * `payload run` argv-drop problem documented in the file header, closed at this script's own
 * argument-parsing layer instead of relying on every flag name being guessed correctly by
 * whoever is invoking it.
 *
 * A bare `--` is allowed through unexamined: `pnpm seed:catalogue -- --dry-run` legitimately
 * puts a literal `--` in `process.argv` here. `payload run` rebuilds `process.argv` from
 * minimist's positional arguments only (see the file header); minimist treats the *first* `--`
 * in its input as "stop parsing flags", consuming it, but a *second* `--` — the one contributed
 * by `pnpm run seed:catalogue -- --dry-run` on top of the `--` already baked into the
 * `seed:catalogue` package script — is just another positional string and survives verbatim
 * into this script's argv alongside the real flags.
 */
const KNOWN_FLAGS = new Set(["--dry-run", "--overwrite", "--yes"]);

function parseArgs(argv: readonly string[]): { dryRun: boolean; overwrite: boolean; yes: boolean } {
  for (const arg of argv) {
    if (arg === "--") continue;
    if (!KNOWN_FLAGS.has(arg)) {
      throw new Error(
        `unknown flag ${arg} (known flags: ${[...KNOWN_FLAGS].join(", ")}) — invoke this ` +
          `script via "pnpm seed:catalogue -- <flags>"; see the file header for why the "--" ` +
          `matters`,
      );
    }
  }
  const flags = new Set(argv);
  return {
    dryRun: flags.has("--dry-run"),
    overwrite: flags.has("--overwrite"),
    yes: flags.has("--yes"),
  };
}

const { dryRun, overwrite, yes } = parseArgs(process.argv.slice(2));

/**
 * Prints the database this run is about to write to — host and database name only, never the
 * password or the full connection string — before any write happens, on every run (not just
 * `--overwrite`). Reuses `getDatabaseUrlFromUrlAndPassword` (see `src/utils/database-url.ts`)
 * to resolve the same env vars `payload.config.ts` does, rather than re-parsing `DATABASE_URL`
 * by hand.
 */
function printDatabaseTarget(): void {
  const resolvedUrl = getDatabaseUrlFromUrlAndPassword(env.DATABASE_URL, env.DATABASE_PASSWORD);
  const { host, pathname } = new URL(resolvedUrl);
  console.log(`\n  target      ${host}${pathname}`);
}

/**
 * ⚠ `--overwrite` rewrites existing rows from the source JSON instead of skipping them, and it
 * loses editor work in the admin UI. The clearest case is the localized block labels described
 * on `CARRIED_TO_TRANSLATIONS` above: every translated `popupTemplate.fieldInfos[].label` and
 * `legend.items[].label` is reset to its English source text, with no warning and no way to
 * tell which ones had been translated. Anything else an editor changed on a seeded field goes
 * the same way, since the source row is written verbatim.
 *
 * It is safe on a catalogue nobody has edited — a re-import, or fixing a bad seed. Treat it as
 * unsafe on a live one.
 *
 * `--overwrite` alone therefore refuses to run: it requires an explicit `--yes` alongside it,
 * checked here before any database connection opens (no interactive prompt — this has to stay
 * non-interactive for CI and scripted use). `--yes` is required even under `--dry-run`: a dry
 * run's transaction is rolled back, so nothing is actually destroyed, but the flag's meaning
 * ("I intend the destructive rewrite") should not change depending on `--dry-run`, and an
 * operator rehearsing a run should confirm the same thing they will need to confirm for real.
 */
function assertOverwriteConfirmed(): void {
  if (!overwrite || yes) return;

  console.error(`
  ❌ --overwrite refused: --yes is required.

  --overwrite rewrites every existing topic, subtopic and indicator row from the source JSON.
  In particular, it resets any editor-translated label back to its English source text on:

    - resource[].popupTemplate.fieldInfos[].label
    - resource[].legend.items[].label

  Any other field an editor changed on a seeded row is overwritten the same way, since the
  source row is written back verbatim. This applies even under --dry-run, whose transaction is
  rolled back but whose intent should still be confirmed explicitly.

  Re-run with "--overwrite --yes" once you have confirmed this is what you want.
`);
  process.exit(1);
}

printDatabaseTarget();
assertOverwriteConfirmed();

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
  const carryFields = CARRIED_TO_TRANSLATIONS[collection] ?? [];

  for (const locale of TRANSLATION_LOCALES) {
    const data = locales[locale];
    if (!data || Object.keys(data).length === 0) continue;
    // Same `update` generic-composition limitation as above.
    await payload.update({
      collection,
      id,
      data: buildTranslationData(written, carryFields, data) as never,
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
