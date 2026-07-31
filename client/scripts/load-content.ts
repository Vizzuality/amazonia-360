/**
 * Loads the reviewed dataset into the CMS (AM-669).
 *
 * Run with `pnpm load-content` against a migrated database.
 *
 * Idempotent: records are upserted under their original ids, so running it
 * twice against a fresh database produces the same result.
 */
import { readFileSync } from "node:fs";
import path from "node:path";

import { getPayload } from "payload";

import config from "@payload-config";

import type { ContentDataset } from "@/lib/content-transform/types";

import { loadContent } from "@/cms/seed/content";

const DATASET = path.resolve(process.cwd(), "datum", "cms", "content.json");

const main = async () => {
  const dataset = JSON.parse(readFileSync(DATASET, "utf8")) as ContentDataset;
  const payload = await getPayload({ config });

  const report = await loadContent({
    payload,
    dataset,
    log: (message) => console.log(`  ${message}`),
  });

  console.log(
    `\nLoaded ${report.topics} topics, ${report.subtopics} subtopics, ${report.indicators} indicators; ${report.layoutsAttached} layouts attached.`,
  );

  // Guard the two failure modes that are otherwise silent.
  const published = await Promise.all(
    (["topics", "subtopics", "indicators"] as const).map(async (collection) => {
      const all = await payload.find({
        collection,
        limit: 0,
        pagination: false,
        depth: 0,
        overrideAccess: true,
        draft: true,
      });
      const drafts = all.docs.filter((doc) => doc._status !== "published");
      const nonNumeric = all.docs.filter((doc) => typeof doc.id !== "number");

      return {
        collection,
        total: all.docs.length,
        drafts: drafts.length,
        nonNumeric: nonNumeric.length,
      };
    }),
  );

  let failed = false;

  for (const check of published) {
    console.log(
      `  ${check.collection}: ${check.total} records, ${check.drafts} draft(s), ${check.nonNumeric} non-numeric id(s)`,
    );
    if (check.drafts > 0 || check.nonNumeric > 0) failed = true;
  }

  if (failed) {
    console.error(
      "\nRecords are not all published with numeric ids. The public site would not see them.",
    );
    process.exit(1);
  }

  console.log("\nEvery record is published and keyed by a numeric id.");
  process.exit(0);
};

// Awaited so `payload run` does not exit the process before the load finishes.
await main().catch((error) => {
  console.error(error);
  process.exit(1);
});
