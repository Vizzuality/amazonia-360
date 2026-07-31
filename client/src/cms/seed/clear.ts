import type { Payload } from "payload";

import type { SeedCounts } from "./guard";
import { SEEDED_COLLECTIONS } from "./types";

/**
 * Empties the content collections so a forced seed can reload them.
 *
 * The seed lets Payload mint the uuids, so it cannot recognise a record it wrote
 * on an earlier run — re-running over a populated database would duplicate the
 * catalogue rather than update it.
 *
 * Children before parents. The relationships are `ON DELETE set null`, so the
 * other order would not fail; it would leave surviving Indicators pointing at
 * nothing, and a mid-run failure would strand that in the database.
 */
export const clearContent = async ({
  payload,
  log = () => {},
}: {
  payload: Payload;
  log?: (message: string) => void;
}): Promise<SeedCounts> => {
  const removed: SeedCounts = { topics: 0, subtopics: 0, indicators: 0 };

  for (const collection of [...SEEDED_COLLECTIONS].reverse()) {
    // Bulk delete requires a `where`, and an empty one is not a match-all.
    const { docs } = await payload.delete({
      collection,
      where: { id: { exists: true } },
      overrideAccess: true,
    });

    removed[collection] = docs.length;
  }

  log(
    `cleared: ${SEEDED_COLLECTIONS.map((collection) => `${removed[collection]} ${collection}`).join(", ")}`,
  );

  return removed;
};
