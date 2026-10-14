import type { Payload } from "payload";

import { getModuleIdsBySlug } from "./seed-country-modules";
import { localizeValue } from "./utils/normalize-data";
import { updateLocales } from "./utils/seed-helpers";
import type { RawPartner } from "./utils/types";

export const seedPartners = async (payload: Payload, partners: RawPartner[]): Promise<void> => {
  const moduleIds = await getModuleIdsBySlug(payload);
  const seenNames = new Set<string>();

  for (const raw of partners) {
    if (seenNames.has(raw.name)) {
      payload.logger.warn(`partners: duplicate name ${raw.name}, skipped`);
      continue;
    }
    seenNames.add(raw.name);

    const modules = raw.modules.map((slug) => {
      const id = moduleIds.get(slug);
      if (!id) throw new Error(`partners: ${raw.name} names unknown country module ${slug}`);
      return id;
    });

    const logo = localizeValue(raw.logo_en, raw.logo_es, raw.logo_pt);

    const data = {
      name: raw.name,
      label: raw.label ?? null,
      tag: raw.tag ?? null,
      logo: logo.en,
      logoSize: raw.logoSize ?? ("default" as const),
      regional: raw.regional,
      modules,
      order: raw.order,
    };

    const { docs } = await payload.find({
      collection: "partners",
      where: { name: { equals: raw.name } },
      select: {},
      depth: 0,
      limit: 1,
    });
    const existing = docs[0];

    let id: string;
    if (existing) {
      id = existing.id;
      await payload.update({ collection: "partners", id, data });
    } else {
      const created = await payload.create({ collection: "partners", data });
      id = created.id;
    }

    await updateLocales(payload, "partners", id, { logo });
  }
};
