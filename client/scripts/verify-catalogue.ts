/**
 * Read-only audit of the seeded catalogue. Never writes: no create, no update, no delete,
 * no transaction. Run it after `pnpm seed:catalogue` to prove the catalogue is complete,
 * published and translated, and re-run it after future migrations.
 *
 * `pnpm verify:catalogue`                — full audit, expects a seeded catalogue
 * `pnpm verify:catalogue -- --expect-empty` — asserts the three tables are empty instead,
 *                                            which is how the dry run's rollback is proved
 */
import { getPayload, type Payload } from "payload";

import config from "@payload-config";

import { LOCALES, rawIndicators, rawSubtopics, rawTopics, type Locale } from "@/cms/seed/source";

type CatalogueSlug = "topics" | "subtopics" | "indicators";

const SLUGS = ["topics", "subtopics", "indicators"] as const satisfies readonly CatalogueSlug[];

/**
 * Both derived from the source JSON rather than hand-typed, so the audit tracks the source
 * instead of rotting against it: add an indicator to `datum/indicators.json` and this stays
 * correct instead of FAILing for the wrong reason (a stale expected count), and removing one
 * no longer risks a PASS while an orphaned published document lingers — see the legacy_id
 * set-equality check below, which is what actually catches that second case.
 */
const EXPECTED_ROWS: Record<CatalogueSlug, number> = {
  topics: rawTopics.length,
  subtopics: rawSubtopics.length,
  indicators: rawIndicators.length,
};
const EXPECTED_DEFAULT_VIS = {
  topics: rawTopics.filter((r) => r.default_visualization?.length).length,
  subtopics: rawSubtopics.filter((r) => r.default_visualization?.length).length,
} as const;

/** The `raw*` source arrays, keyed the same way as `EXPECTED_ROWS`/`SLUGS`. */
const RAW_SOURCE: Record<CatalogueSlug, readonly { id: number }[]> = {
  topics: rawTopics,
  subtopics: rawSubtopics,
  indicators: rawIndicators,
};

const expectEmpty = process.argv.slice(2).includes("--expect-empty");

/** A catalogue document, read loosely — the audit only touches fields all three share. */
type Row = {
  id: string;
  legacy_id?: number | null;
  name?: string | null;
  _status?: string | null;
  default_visualization?: unknown[] | null;
  visualization_types?: unknown;
  resource?: unknown;
};

let failures = 0;

function check(ok: boolean, label: string, detail?: string) {
  if (!ok) failures += 1;
  console.log(`  ${ok ? "PASS" : "FAIL"}  ${label}${detail ? `  — ${detail}` : ""}`);
}

/**
 * Every row of a collection in one locale, relationships unresolved.
 *
 * `draft: true` reads the versions table and returns each document's newest version;
 * `draft: false` reads the live collection table, which is what the app itself sees. Both
 * are audited, because a row can only be trusted when it is published in both views.
 */
async function readAll(
  payload: Payload,
  collection: CatalogueSlug,
  locale: Locale,
  draft = true,
): Promise<Row[]> {
  const { docs } = await payload.find({
    collection,
    locale,
    // Without this, a missing es/pt name silently falls back to en and the locale audit
    // below would pass on every row regardless of whether translations were written.
    fallbackLocale: false,
    draft,
    depth: 0,
    limit: 0,
    pagination: false,
    overrideAccess: true,
  });
  return docs as unknown as Row[];
}

async function one(
  payload: Payload,
  collection: CatalogueSlug,
  legacyId: number,
  { locale = "en", depth = 0 }: { locale?: Locale; depth?: number } = {},
): Promise<Row | undefined> {
  const { docs } = await payload.find({
    collection,
    where: { legacy_id: { equals: legacyId } },
    locale,
    fallbackLocale: false,
    draft: true,
    depth,
    limit: 1,
    pagination: false,
    overrideAccess: true,
  });
  return docs[0] as unknown as Row | undefined;
}

function legacyIds(rows: Row[]): string {
  return rows
    .map((r) => r.legacy_id ?? "?")
    .slice(0, 20)
    .join(", ");
}

type Views = Record<CatalogueSlug, { versions: Row[]; live: Row[] }>;

async function auditCounts(payload: Payload): Promise<Views> {
  console.log("\nRow counts\n");
  const views = {} as Views;

  for (const slug of SLUGS) {
    const versions = await readAll(payload, slug, "en", true);
    const live = await readAll(payload, slug, "en", false);
    views[slug] = { versions, live };

    const expected = expectEmpty ? 0 : EXPECTED_ROWS[slug];
    check(
      versions.length === expected && live.length === expected,
      `${slug.padEnd(10)} ${versions.length} rows (expected ${expected})`,
      `${live.length} in the live collection table`,
    );
  }

  return views;
}

function auditStatus(views: Views) {
  console.log("\nPublish status — the assertion that matters most\n");

  for (const slug of SLUGS) {
    for (const [view, rows] of [
      ["newest version", views[slug].versions],
      ["live table   ", views[slug].live],
    ] as const) {
      const unpublished = rows.filter((r) => r._status !== "published");
      check(
        unpublished.length === 0,
        `${slug.padEnd(10)} ${view}  ${unpublished.length} of ${rows.length} rows not published`,
        unpublished.length ? `legacy_id: ${legacyIds(unpublished)}` : undefined,
      );
    }
  }
}

async function auditLocales(payload: Payload) {
  console.log("\nLocale coverage — blank `name` per locale, no en fallback\n");

  for (const slug of SLUGS) {
    for (const locale of LOCALES) {
      const rows = await readAll(payload, slug, locale);
      const blank = rows.filter((r) => !r.name || String(r.name).trim() === "");
      check(
        blank.length === 0,
        `${slug.padEnd(10)} ${locale}  ${blank.length} blank names of ${rows.length}`,
        blank.length ? `legacy_id: ${legacyIds(blank)}` : undefined,
      );
    }
  }
}

function auditDefaultVisualization(views: Views) {
  console.log("\ndefault_visualization backfill\n");

  for (const slug of ["topics", "subtopics"] as const) {
    const withEntries = views[slug].live.filter((r) => (r.default_visualization?.length ?? 0) > 0);
    check(
      withEntries.length === EXPECTED_DEFAULT_VIS[slug],
      `${slug.padEnd(10)} ${withEntries.length} rows with entries (expected ${EXPECTED_DEFAULT_VIS[slug]})`,
    );
  }
}

/**
 * Set-equality between the `legacy_id`s live in the database and the ids in the source JSON.
 *
 * Every other check in this file assumes the two are in sync; nothing before this one would
 * catch a source deletion (a row removed from `datum/*.json` but never removed from the
 * database — the row would keep passing `auditStatus`/`auditLocales` forever) or an orphaned
 * database row (present here for some other reason, no matching source id). This is the one
 * drift direction the rest of the audit is blind to.
 */
function auditLegacyIdCoverage(views: Views) {
  console.log("\nSource drift — legacy_id set equality against datum/*.json\n");

  for (const slug of SLUGS) {
    const dbIds = new Set(
      views[slug].live.map((r) => r.legacy_id).filter((id): id is number => typeof id === "number"),
    );
    const sourceIds = new Set(RAW_SOURCE[slug].map((r) => r.id));

    const missingFromDb = [...sourceIds].filter((id) => !dbIds.has(id)).sort((a, b) => a - b);
    const orphanedInDb = [...dbIds].filter((id) => !sourceIds.has(id)).sort((a, b) => a - b);

    check(
      missingFromDb.length === 0,
      `${slug.padEnd(10)} ${missingFromDb.length} source id(s) missing from the database`,
      missingFromDb.length ? `legacy_id: ${missingFromDb.slice(0, 20).join(", ")}` : undefined,
    );
    check(
      orphanedInDb.length === 0,
      `${slug.padEnd(10)} ${orphanedInDb.length} database row(s) with no matching source id`,
      orphanedInDb.length ? `legacy_id: ${orphanedInDb.slice(0, 20).join(", ")}` : undefined,
    );
  }
}

async function auditFixes(payload: Payload) {
  console.log("\nTargeted spot checks\n");

  // Fix 1 — subtopic 26's only default_visualization entry was repointed from the deleted
  // indicator 55 to indicator 146. depth: 1 so the relationship resolves to its legacy_id.
  const subtopic26 = await one(payload, "subtopics", 26, { depth: 1 });
  const entries = (subtopic26?.default_visualization ?? []) as {
    indicator?: { legacy_id?: number };
  }[];
  check(
    entries.length === 1 && entries[0]?.indicator?.legacy_id === 146,
    "fix 1  subtopics 26 default_visualization -> indicator legacy_id 146",
    `${entries.length} entries, resolved legacy_id ${entries[0]?.indicator?.legacy_id ?? "none"}`,
  );

  // Fix 2 — indicator 5 gained the chart widget.
  const indicator5 = await one(payload, "indicators", 5);
  const types = (indicator5?.visualization_types ?? []) as string[];
  check(
    types.includes("chart"),
    "fix 2  indicators 5 visualization_types includes chart",
    `[${types.join(", ")}]`,
  );

  // Fix 3 — indicator 12 is a feature block, so its bogus rasterFunction was dropped.
  const indicator12 = await one(payload, "indicators", 12);
  const block12 = ((indicator12?.resource ?? []) as Record<string, unknown>[])[0] ?? {};
  check(
    block12.blockType === "feature" && !("rasterFunction" in block12),
    "fix 3  indicators 12 resource[0] is feature with no rasterFunction",
    `blockType ${String(block12.blockType)}, rasterFunction ${"rasterFunction" in block12 ? "present" : "absent"}`,
  );

  // Fix 4 + translations — trimmed en name, and a real es translation.
  const subtopic3En = await one(payload, "subtopics", 3, { locale: "en" });
  const subtopic3Es = await one(payload, "subtopics", 3, { locale: "es" });
  check(
    subtopic3En?.name === "Land Cover",
    "fix 4  subtopics 3 en name is exactly 'Land Cover'",
    JSON.stringify(subtopic3En?.name),
  );
  check(
    subtopic3Es?.name === "Cobertura del Suelo",
    "        subtopics 3 es name is 'Cobertura del Suelo'",
    JSON.stringify(subtopic3Es?.name),
  );

  // Nested trim — the trim reaches inside block subfields, not just top-level text.
  const indicator140 = await one(payload, "indicators", 140);
  const block140 = ((indicator140?.resource ?? []) as Record<string, unknown>[])[0] ?? {};
  const fieldName = ((
    block140.popupTemplate as { fieldInfos?: { fieldName?: string }[] } | undefined
  )?.fieldInfos ?? [])[0]?.fieldName;
  check(
    fieldName === "LENGTHm",
    "trim   indicators 140 resource[0].popupTemplate.fieldInfos[0].fieldName is 'LENGTHm'",
    JSON.stringify(fieldName),
  );

  // `popupTemplate.fieldInfos[].label` is localized and required, so the seed carries the
  // block array into the es/pt writes. Assert the outcome directly: the labels are present in
  // every locale, and carrying the blocks three times did not duplicate the block rows.
  for (const locale of LOCALES) {
    const doc = await one(payload, "indicators", 5, { locale });
    const blocks = (doc?.resource ?? []) as {
      popupTemplate?: { fieldInfos?: { label?: string }[] };
    }[];
    const labels = (blocks[0]?.popupTemplate?.fieldInfos ?? []).map((f) => f.label);
    check(
      blocks.length === 1 && labels.length === 2 && labels.every((l) => !!l && l.trim() !== ""),
      `blocks indicators 5 ${locale}  1 resource block, 2 non-blank popup labels`,
      `${blocks.length} blocks, labels ${JSON.stringify(labels)}`,
    );
  }
}

async function main() {
  const payload = await getPayload({ config });

  try {
    console.log(
      `\nVerifying catalogue (${expectEmpty ? "expecting empty tables" : "expecting a full seed"})`,
    );

    const views = await auditCounts(payload);

    if (expectEmpty) {
      console.log("\n  content assertions skipped in --expect-empty mode\n");
      return;
    }

    auditStatus(views);
    await auditLocales(payload);
    auditDefaultVisualization(views);
    auditLegacyIdCoverage(views);
    await auditFixes(payload);
    console.log("");
  } finally {
    await payload.destroy().catch((e) => console.error("  destroy failed:", e));
  }
}

await main().catch((error) => {
  console.error("\n  ❌ verification failed to run:", error);
  process.exit(1);
});

if (failures > 0) {
  console.error(`  ❌ ${failures} assertion(s) failed\n`);
  process.exit(1);
}
console.log("  ✅ all assertions passed\n");
