import type { Payload } from "payload";

import type { LocalizedValue } from "./types";

type SeededCollection = "topics" | "subtopics" | "indicators" | "country-modules" | "partners";

const DRAFT_COLLECTIONS: ReadonlySet<SeededCollection> = new Set([
  "topics",
  "subtopics",
  "indicators",
]);

/**
 * Writes the es/pt translations on top of the English row. A missing translation is left
 * alone, so it falls back to English — except for the fields in `clearWhenEmpty`, which are
 * written as `null`. Payload still falls back on `null`, so this only clears a translation
 * whose English was dropped too, or one the source stopped carrying.
 *
 * Payload 4 keeps `_status` per locale and validates required fields per published locale, so
 * drafts collections publish each locale explicitly and copy English into a missing translation.
 */
export async function updateLocales<K extends string>(
  payload: Payload,
  collection: SeededCollection,
  id: string,
  localizedFields: Record<K, LocalizedValue>,
  clearWhenEmpty: readonly NoInfer<K>[] = [],
): Promise<void> {
  const isDraftCollection = DRAFT_COLLECTIONS.has(collection);
  for (const locale of ["es", "pt"] as const) {
    const data: Record<string, string | null> = {};
    for (const [field, value] of Object.entries(localizedFields) as [K, LocalizedValue][]) {
      if (value[locale]) data[field] = value[locale];
      else if (clearWhenEmpty.includes(field)) data[field] = null;
      else if (isDraftCollection && value.en) data[field] = value.en;
    }
    if (isDraftCollection) data._status = "published";
    if (Object.keys(data).length > 0) {
      await payload.update({ collection, id, locale, data, overrideAccess: true });
    }
  }
}
