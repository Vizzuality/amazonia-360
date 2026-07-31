import type { Payload } from "payload";

import { clearContent } from "./clear";
import type { SeedReport } from "./content";
import { seedContent } from "./content";
import type { SeedCounts } from "./guard";
import { assertSafeToSeed, describeCounts } from "./guard";
import type { ContentDataset } from "./types";
import { expectedFrom, verifySeed } from "./verify";

/**
 * Guard, clear, seed, verify — the whole sequence, in one place (AM-669).
 *
 * Shared by `pnpm seed` and `pnpm seed:force` so the two differ only in the
 * `force` flag. They are separate scripts rather than one script taking
 * `--force` because `payload run` discards every argument after the script path:
 * a flag passed to `pnpm seed` never reaches `process.argv`, so the override
 * would be silently unreachable.
 *
 * The clear step only runs on the forced path, and only when there is something to
 * clear — the guard has already refused every other populated case.
 */

export type RunSeedResult = {
  /** Counts found before writing, for reporting a forced overwrite. */
  before: SeedCounts;
  report: SeedReport;
  lines: string[];
  problems: string[];
};

export const runSeed = async ({
  payload,
  dataset,
  force = false,
  log = () => {},
}: {
  payload: Payload;
  dataset: ContentDataset;
  force?: boolean;
  log?: (message: string) => void;
}): Promise<RunSeedResult> => {
  const before = await assertSafeToSeed({ payload, force });

  if (force && Object.values(before).some((count) => count > 0)) {
    log(`force: overwriting ${describeCounts(before)}`);
    await clearContent({ payload, log });
  }

  const report = await seedContent({ payload, dataset, log });
  const { lines, problems } = await verifySeed({ payload, expected: expectedFrom(dataset) });

  return { before, report, lines, problems };
};
