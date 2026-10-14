import type { Payload } from "payload";

import { isEmptyValue } from "@/cms/test-utils/find-field";

import { localizeValue } from "./utils/normalize-data";
import { updateLocales } from "./utils/seed-helpers";
import type { RawCountryModule } from "./utils/types";

export const getModuleIdsBySlug = async (payload: Payload): Promise<Map<string, string>> => {
  const { docs } = await payload.find({
    collection: "country-modules",
    select: { slug: true },
    depth: 0,
    pagination: false,
  });

  return new Map(docs.map(({ slug, id }) => [slug, id]));
};

export const seedCountryModules = async (
  payload: Payload,
  modules: RawCountryModule[],
): Promise<void> => {
  const seenSlugs = new Set<string>();

  for (const raw of modules) {
    if (seenSlugs.has(raw.slug)) {
      payload.logger.warn(`country-modules: duplicate slug ${raw.slug}, skipped`);
      continue;
    }
    seenSlugs.add(raw.slug);

    const name = localizeValue(raw.name_en, raw.name_es, raw.name_pt);
    const moduleName = localizeValue(raw.moduleName_en, raw.moduleName_es, raw.moduleName_pt);
    const partnersDescription = localizeValue(
      raw.partnersDescription_en,
      raw.partnersDescription_es,
      raw.partnersDescription_pt,
    );

    // editors own `active`; a re-seed must not undo a deactivation
    const data = {
      slug: raw.slug,
      country: raw.country,
      tag: raw.tag,
      order: raw.order,
      bbox: raw.bbox ?? { xmin: null, ymin: null, xmax: null, ymax: null },
      name: name.en,
      moduleName: moduleName.en,
      partnersDescription: isEmptyValue(partnersDescription.en) ? null : partnersDescription.en,
    };

    const { docs } = await payload.find({
      collection: "country-modules",
      where: { slug: { equals: raw.slug } },
      select: {},
      depth: 0,
      limit: 1,
    });
    const existing = docs[0];

    let id: string;
    if (existing) {
      id = existing.id;
      await payload.update({ collection: "country-modules", id, data });
    } else {
      const created = await payload.create({
        collection: "country-modules",
        data: { ...data, active: raw.active },
      });
      id = created.id;
    }

    await updateLocales(payload, "country-modules", id, { name, moduleName, partnersDescription }, [
      "partnersDescription",
    ]);
  }
};
