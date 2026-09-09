import type { Payload } from "payload";

import { isEmptyValue } from "@/cms/test-utils/find-field";

import { localizeValue } from "./utils/normalize-data";
import { updateLocales } from "./utils/seed-helpers";
import type { RawSubtopic } from "./utils/types";

export const seedSubtopics = async (
  payload: Payload,
  rawSubtopics: RawSubtopic[],
): Promise<void> => {
  const seenIds = new Set<number>();

  for (const raw of rawSubtopics) {
    if (seenIds.has(raw.id)) {
      payload.logger.warn(`subtopics: duplicate id ${raw.id}, skipped`);
      continue;
    }
    seenIds.add(raw.id);

    const topic = String(raw.topic_id);
    const topicExists = await payload.findByID({
      collection: "topics",
      id: topic,
      disableErrors: true,
      select: {},
    });
    if (!topicExists) {
      payload.logger.warn(
        `subtopics: id ${raw.id} references missing topic ${raw.topic_id}, skipped`,
      );
      continue;
    }

    const id = String(raw.id);
    const name = localizeValue(raw.name_en, raw.name_es, raw.name_pt);
    const description = localizeValue(raw.description_en, raw.description_es, raw.description_pt);

    await payload.create({
      collection: "subtopics",
      data: {
        id,
        topic,
        name: name.en,
        ...(isEmptyValue(description.en) ? {} : { description: description.en }),
        _status: "published",
      },
    });

    await updateLocales(payload, "subtopics", id, { name, description });
  }
};
