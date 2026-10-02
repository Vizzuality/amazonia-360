import type { Payload } from "payload";

import type { LocalizedValue } from "./types";

/**
 * Writes the es/pt translations on top of the English row. A missing translation is left
 * alone, so it falls back to English — except for the fields in `clearWhenEmpty`, which are
 * written as `null`. Payload still falls back on `null`, so this only clears a translation
 * whose English was dropped too, or one the source stopped carrying.
 */
export async function updateLocales<K extends string>(
  payload: Payload,
  collection: "topics" | "subtopics" | "indicators",
  id: string,
  localizedFields: Record<K, LocalizedValue>,
  clearWhenEmpty: readonly NoInfer<K>[] = [],
): Promise<void> {
  for (const locale of ["es", "pt"] as const) {
    const data: Record<string, string | null> = {};
    for (const [field, value] of Object.entries(localizedFields) as [K, LocalizedValue][]) {
      if (value[locale]) data[field] = value[locale];
      else if (clearWhenEmpty.includes(field)) data[field] = null;
    }
    if (Object.keys(data).length > 0) {
      await payload.update({ collection, id, locale, data });
    }
  }
}

/**
 * Silence is the only thing `scripts/payload-step.mjs` has to tell a slow run
 * from a blocked one, and an uninstrumented seed gives it nothing but silence.
 *
 * The rate is the part worth reading: it is one database round trip times
 * however many the row costs, so rows in seconds rather than milliseconds mean
 * the container and the database are no longer in the same region.
 */
export function createProgressLogger(
  payload: Payload,
  label: string,
  total: number,
  every = 25,
): (done: number) => void {
  const startedAt = Date.now();

  return (done) => {
    if (done === 0 || (done % every !== 0 && done !== total)) return;

    const elapsed = (Date.now() - startedAt) / 1000;
    payload.logger.info(
      `${label}: ${done}/${total} in ${elapsed.toFixed(0)}s (${(elapsed / done).toFixed(2)}s per row)`,
    );
  };
}
