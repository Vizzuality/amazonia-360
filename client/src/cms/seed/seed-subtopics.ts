import type { Payload } from "payload";

import { isEmptyValue } from "@/cms/test-utils/find-field";

import { localizeValue } from "./utils/normalize-data";
import { updateLocales } from "./utils/seed-helpers";
import type { RawSubtopic } from "./utils/types";

export const seedSubtopics = async (payload: Payload, subtopics: RawSubtopic[]): Promise<void> => {
  const seenIds = new Set<number>();

  for (const raw of subtopics) {
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

    const data = {
      topic,
      name: name.en,
      ...(isEmptyValue(description.en) ? {} : { description: description.en }),
      _status: "published" as const,
    };

    const existing = await payload.findByID({
      collection: "subtopics",
      id,
      disableErrors: true,
      select: {},
    });
    if (existing) {
      await payload.update({ collection: "subtopics", id, data });
    } else {
      await payload.create({ collection: "subtopics", data: { id, ...data } });
    }

    await updateLocales(payload, "subtopics", id, { name, description });
  }
};
