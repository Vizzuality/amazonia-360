import { getPayload } from "payload";

import config from "@payload-config";

import dataset from "./data/content.json";
import { runSeed } from "./run";
import type { ContentDataset } from "./types";

/**
 * The shared body of `pnpm seed` and `pnpm seed:force`.
 *
 * Returns an exit code rather than calling `process.exit`, so the scripts stay
 * three lines each and the failure paths are all in one place.
 */
export const seedCli = async ({ force }: { force: boolean }): Promise<number> => {
  const content = dataset as unknown as ContentDataset;

  try {
    const payload = await getPayload({ config });
    const { report, lines, problems } = await runSeed({
      payload,
      dataset: content,
      force,
      log: (message) => console.log(`  ${message}`),
    });

    console.log(
      `\nSeeded ${report.topics} topics, ${report.subtopics} subtopics, ${report.indicators} indicators; ${report.layoutsAttached} layouts attached.\n`,
    );

    for (const line of lines) console.log(`  ${line}`);

    if (problems.length) {
      console.error(`\nPROBLEMS:\n  ${problems.join("\n  ")}`);
      return 1;
    }

    console.log("\nAll checks passed.");
    return 0;
  } catch (error) {
    // The guard's refusal is a message for a person, not a stack trace.
    console.error(error instanceof Error ? error.message : error);
    return 1;
  }
};
