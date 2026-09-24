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
