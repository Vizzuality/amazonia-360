/**
 * Checks an already-seeded database without writing to it (AM-669).
 *
 *   pnpm seed:verify
 *
 * `pnpm seed` runs these same checks straight after seeding. This is the
 * read-only version, for confirming an environment still looks right later —
 * after a deploy, or before handing staging over for review.
 */
import { getPayload } from "payload";

import config from "@payload-config";

import dataset from "@/cms/seed/data/content.json";
import type { ContentDataset } from "@/cms/seed/types";
import { expectedFrom, verifySeed } from "@/cms/seed/verify";

const main = async () => {
  const payload = await getPayload({ config });
  const expected = expectedFrom(dataset as unknown as ContentDataset);

  const { lines, problems } = await verifySeed({ payload, expected });
  for (const line of lines) console.log(`  ${line}`);

  console.log(problems.length ? `\nPROBLEMS:\n  ${problems.join("\n  ")}` : "\nAll checks passed.");
  process.exit(problems.length ? 1 : 0);
};

// Awaited so `payload run` does not exit the process before the checks finish.
await main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
