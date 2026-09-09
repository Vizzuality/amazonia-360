import type { Payload } from "payload";

import type { LocalizedValue } from "./types";

export async function updateLocales(
  payload: Payload,
  collection: "topics" | "subtopics" | "indicators",
  id: string,
  localizedFields: Record<string, LocalizedValue>,
): Promise<void> {
  for (const locale of ["es", "pt"] as const) {
    const data: Record<string, string> = {};
    for (const [field, value] of Object.entries(localizedFields)) {
      if (value[locale]) data[field] = value[locale];
    }
    if (Object.keys(data).length > 0) {
      await payload.update({ collection, id, locale, data });
    }
  }
}
