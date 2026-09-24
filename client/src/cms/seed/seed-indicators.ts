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
  // A country target is not dropped like other bad values: `filterOptions` rejects it, and the
  // seed aborts mid-write. So `replaces` resolves only against regional ids already written.
  const seededRegionalIds = new Set<string>();
  const ordered = [
    ...indicators.filter(({ country }) => !country),
    ...indicators.filter(({ country }) => country),
  ];

  for (const raw of ordered) {
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
      if (seededRegionalIds.has(target)) {
        replaces = target;
      } else {
        payload.logger.warn(
          `indicators: id ${raw.id} replaces ${raw.replaces}, which is not a seeded regional indicator, left empty`,
        );
      }
    }

    const data = {
      order: raw.order,
      subtopic,
      // Optional fields are written even when empty: a re-seed has to clear a value the source
      // data dropped, and an omitted key would leave the old one standing.
      country,
      replaces,
      name: name.en,
      unit: isEmptyValue(unit.en) ? null : unit.en,
      description_short: descriptionShort.en,
      description: isEmptyValue(description.en) ? null : description.en,
      visualization_types: raw.visualization_types,
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

    if (!country) seededRegionalIds.add(id);

    await updateLocales(
      payload,
      "indicators",
      id,
      { name, unit, description_short: descriptionShort, description },
      ["unit", "description"],
    );
  }
};
