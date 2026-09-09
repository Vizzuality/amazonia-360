import type { Payload } from "payload";

import { isEmptyValue } from "@/cms/test-utils/find-field";

import { localizeValue } from "./utils/normalize-data";
import { updateLocales } from "./utils/seed-helpers";
import type { RawTopic } from "./utils/types";

export const seedTopics = async (payload: Payload, rawTopics: RawTopic[]): Promise<void> => {
  const seenIds = new Set<number>();

  for (const raw of rawTopics) {
    if (seenIds.has(raw.id)) {
      payload.logger.warn(`topics: duplicate id ${raw.id}, skipped`);
      continue;
    }
    seenIds.add(raw.id);

    const id = String(raw.id);
    const name = localizeValue(raw.name_en, raw.name_es, raw.name_pt);
    const description = localizeValue(raw.description_en, raw.description_es, raw.description_pt);

    await payload.create({
      collection: "topics",
      data: {
        id,
        name: name.en,
        ...(isEmptyValue(description.en) ? {} : { description: description.en }),
        ...(isEmptyValue(raw.image) ? {} : { image: raw.image }),
        _status: "published",
      },
    });

    await updateLocales(payload, "topics", id, { name, description });
  }
};
