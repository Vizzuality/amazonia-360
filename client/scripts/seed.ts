/**
 * Seeds the reviewed content dataset into the CMS (AM-669).
 *
 *   pnpm seed            # empty database only
 *   pnpm seed --force    # overwrite whatever is there
 *
 * Runs against whatever database the environment points at, so the same command
 * serves local, develop, staging and production. The dataset lives under `src/`
 * so that it ships in the runtime image and this can run inside a deployed
 * container as well as from a workstation.
 *
 * Idempotent by construction — records are upserted under their original ids —
 * but see `assertSafeToSeed`: idempotent is not the same as safe to re-run once
 * editors have touched the content.
 */
import { getPayload } from "payload";

import config from "@payload-config";

import { seedContent } from "@/cms/seed/content";
import dataset from "@/cms/seed/data/content.json";
import { assertSafeToSeed, describeCounts } from "@/cms/seed/guard";
import type { ContentDataset } from "@/cms/seed/types";
import { expectedFrom, verifySeed } from "@/cms/seed/verify";

const force = process.argv.includes("--force");

const main = async () => {
  const content = dataset as unknown as ContentDataset;
  const payload = await getPayload({ config });

  const before = await assertSafeToSeed({ payload, force });

  if (force && !Object.values(before).every((count) => count === 0)) {
    console.log(`--force: overwriting ${describeCounts(before)}\n`);
  }

  const report = await seedContent({
    payload,
    dataset: content,
    log: (message) => console.log(`  ${message}`),
  });

  console.log(
    `\nSeeded ${report.topics} topics, ${report.subtopics} subtopics, ${report.indicators} indicators; ${report.layoutsAttached} layouts attached.\n`,
  );

  const { lines, problems } = await verifySeed({ payload, expected: expectedFrom(content) });
  for (const line of lines) console.log(`  ${line}`);

  if (problems.length) {
    console.error(`\nPROBLEMS:\n  ${problems.join("\n  ")}`);
    process.exit(1);
  }

  console.log("\nAll checks passed.");
  process.exit(0);
};

// Awaited so `payload run` does not exit the process before the seed finishes.
await main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
