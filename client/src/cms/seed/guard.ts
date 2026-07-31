import type { Payload } from "payload";

import type { SeededCollection } from "./types";
import { SEEDED_COLLECTIONS } from "./types";

/**
 * Stops the seed destroying editorial work (AM-669).
 *
 * `seedContent` cannot recognise what an earlier run wrote, so the forced path
 * *clears* the content collections and reloads them. Once the CMS is the source of
 * truth and editors are working in the admin, that discards their edits
 * irrecoverably.
 *
 * So a populated database has to be opted into explicitly. The counts are reported
 * rather than just refused, because the operator's next question is always
 * "populated with what?".
 */

export type SeedCounts = Record<SeededCollection, number>;

export const countSeeded = async (payload: Payload): Promise<SeedCounts> => {
  const entries = await Promise.all(
    SEEDED_COLLECTIONS.map(async (collection) => {
      const { totalDocs } = await payload.count({ collection, overrideAccess: true });

      return [collection, totalDocs] as const;
    }),
  );

  return Object.fromEntries(entries) as SeedCounts;
};

export const isEmpty = (counts: SeedCounts): boolean =>
  SEEDED_COLLECTIONS.every((collection) => counts[collection] === 0);

export const describeCounts = (counts: SeedCounts): string =>
  SEEDED_COLLECTIONS.map((collection) => `${counts[collection]} ${collection}`).join(", ");

/**
 * Throws unless the database is empty or `force` was passed.
 *
 * Deliberately refuses on a *partially* seeded database too. A half-finished
 * seed and a database an editor has been working in look identical from here,
 * and only a person can tell them apart — so it stops and says what it found
 * rather than guessing which one it is.
 */
export const assertSafeToSeed = async ({
  payload,
  force = false,
}: {
  payload: Payload;
  force?: boolean;
}): Promise<SeedCounts> => {
  const counts = await countSeeded(payload);

  if (force || isEmpty(counts)) return counts;

  throw new Error(
    [
      `Refusing to seed: the database already holds ${describeCounts(counts)}.`,
      "",
      "Seeding replaces the content collections wholesale, so this would discard",
      "any content edited in the admin since the last seed. If that is what you",
      "want — a fresh environment, or recovering from a seed that failed part way",
      "— run:",
      "",
      "  pnpm seed:force",
      "",
      "(A separate script, not a flag: `payload run` discards arguments, so",
      "`pnpm seed --force` would seed without forcing.)",
    ].join("\n"),
  );
};
