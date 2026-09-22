import type { Payload } from "payload";

import { COUNTRIES } from "@/lib/country";

import { isEmptyValue } from "@/cms/test-utils/find-field";
import type { Indicator } from "@/payload-types";

import { localizeValue, mapResource } from "./utils/normalize-data";
import { updateLocales } from "./utils/seed-helpers";
import type { RawIndicator } from "./utils/types";

type CountryModule = NonNullable<Indicator["country"]>;

/**
 * Deliberately not `isCountryCode` from `lib/country`, which answers whether a module is live.
 * A row belongs to its module whether or not that module has been released, so the delivery
 * for a country that is still dark seeds normally.
 */
const isCountryModule = (value: string): value is CountryModule =>
  COUNTRIES.some(({ code }) => code === value);

export const seedIndicators = async (
  payload: Payload,
  indicators: RawIndicator[],
): Promise<void> => {
  const seenIds = new Set<number>();
  // Ids actually written, so a `replaces` pointing at a row the seed skipped is dropped with a
  // warning rather than saved as a dangling relationship.
  const seededIds = new Set<string>();

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

    let country: CountryModule | null = null;
    if (raw.country) {
      if (isCountryModule(raw.country)) {
        country = raw.country;
      } else {
        payload.logger.warn(
          `indicators: id ${raw.id} names unknown country module ${raw.country}, left empty`,
        );
      }
    }

    let replaces: string | null = null;
    if (raw.replaces != null) {
      const target = String(raw.replaces);
      if (seededIds.has(target)) {
        replaces = target;
      } else {
        payload.logger.warn(
          `indicators: id ${raw.id} replaces missing indicator ${raw.replaces}, left empty`,
        );
      }
    }

    const data = {
      order: raw.order,
      subtopic,
      // Written even when empty, like `default_visualization_type` below: a re-seed has to
      // clear a scope or a replacement the source data dropped.
      country,
      replaces,
      name: name.en,
      ...(isEmptyValue(unit.en) ? {} : { unit: unit.en }),
      description_short: descriptionShort.en,
      ...(isEmptyValue(description.en) ? {} : { description: description.en }),
      visualization_types: raw.visualization_types,
      // Written even when null, unlike the optional fields above: a re-seed has to clear a
      // default the source data dropped, and an omitted key would leave the old one standing.
      default_visualization_type: raw.default_visualization_type,
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

    seededIds.add(id);

    await updateLocales(payload, "indicators", id, {
      name,
      unit,
      description_short: descriptionShort,
      description,
    });
  }
};
