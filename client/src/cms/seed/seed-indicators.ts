import type { Payload } from "payload";

import { isEmptyValue } from "@/cms/test-utils/find-field";

import { localizeValue, mapResource } from "./utils/normalize-data";
import { updateLocales } from "./utils/seed-helpers";
import type { RawIndicator } from "./utils/types";

export const seedIndicators = async (
  payload: Payload,
  indicators: RawIndicator[],
): Promise<void> => {
  const seenIds = new Set<number>();

  for (const raw of indicators) {
    if (seenIds.has(raw.id)) {
      payload.logger.warn(`indicators: duplicate id ${raw.id}, skipped`);
      continue;
    }
    seenIds.add(raw.id);

    const subtopic = String(raw.subtopic_id);
    const subtopicExists = await payload.findByID({
      collection: "subtopics",
      id: subtopic,
      disableErrors: true,
      select: {},
    });
    if (!subtopicExists) {
      payload.logger.warn(
        `indicators: id ${raw.id} references missing subtopic ${raw.subtopic_id}, skipped`,
      );
      continue;
    }

    const id = String(raw.id);
    const name = localizeValue(raw.name_en, raw.name_es, raw.name_pt);
    const unit = localizeValue(raw.unit_en, raw.unit_es, raw.unit_pt);
    const descriptionShort = localizeValue(
      raw.description_short_en,
      raw.description_short_es,
      raw.description_short_pt,
    );
    const description = localizeValue(raw.description_en, raw.description_es, raw.description_pt);

    const data = {
      order: raw.order,
      subtopic,
      name: name.en,
      ...(isEmptyValue(unit.en) ? {} : { unit: unit.en }),
      description_short: descriptionShort.en,
      ...(isEmptyValue(description.en) ? {} : { description: description.en }),
      visualization_types: raw.visualization_types,
      resource: [mapResource(raw.resource)],
      _status: "published" as const,
    };

    const existing = await payload.findByID({
      collection: "indicators",
      id,
      disableErrors: true,
      select: {},
    });
    if (existing) {
      await payload.update({ collection: "indicators", id, data });
    } else {
      await payload.create({ collection: "indicators", data: { id, ...data } });
    }

    await updateLocales(payload, "indicators", id, {
      name,
      unit,
      description_short: descriptionShort,
      description,
    });
  }
};
