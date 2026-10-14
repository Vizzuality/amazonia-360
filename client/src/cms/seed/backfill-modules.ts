import type { Payload } from "payload";

import type { PostgresAdapter } from "@payloadcms/db-postgres";
import { and, eq, isNull } from "@payloadcms/db-postgres/drizzle";

import { getModuleIdsBySlug } from "./seed-country-modules";

type Write = (db: PostgresAdapter, id: number | string, moduleIds: string[]) => Promise<unknown>;

type Target = {
  collection: "indicators" | "reports";
  field: "module" | "modules";
  writeDoc: Write;
  writeVersion: Write;
};

type CountryDoc = { id: number | string; country?: string | string[] | null } & Record<
  string,
  unknown
>;

function getColumnWriter(tableName: string, column: string): Write {
  return (db, id, [moduleId]) => {
    const table = db.tables[tableName];

    return db.drizzle
      .update(table)
      .set({ [column]: moduleId })
      .where(and(eq(table.id, id), isNull(table[column])));
  };
}

function getRelationshipWriter(tableName: string, path: string): Write {
  return (db, id, moduleIds) =>
    db.drizzle.insert(db.tables[tableName]).values(
      moduleIds.map((moduleId, index) => ({
        parent: id,
        path,
        order: index + 1,
        "country-modulesID": moduleId,
      })),
    );
}

/**
 * Raw row writes, not `payload.update` or `payload.db.updateOne`: the Local API stamps
 * `updatedAt` and saves a version, and the adapter's update rewrites every array and hasMany
 * select table of the document, so a partial `data` wipes a report's topics.
 */
const TARGETS: readonly Target[] = [
  {
    collection: "indicators",
    field: "module",
    writeDoc: getColumnWriter("indicators", "module"),
    writeVersion: getColumnWriter("_indicators_v", "version_module"),
  },
  {
    collection: "reports",
    field: "modules",
    writeDoc: getRelationshipWriter("reports_rels", "modules"),
    writeVersion: getRelationshipWriter("_reports_v_rels", "version.modules"),
  },
];

function getCountries(country: CountryDoc["country"]): string[] {
  if (!country) return [];

  return Array.isArray(country) ? country : [country];
}

function hasModules(value: unknown): boolean {
  return Array.isArray(value) ? value.length > 0 : !!value;
}

function getMissingModuleIds(
  payload: Payload,
  moduleIdsBySlug: Map<string, string>,
  { collection, field }: Target,
  doc: CountryDoc,
): string[] {
  if (hasModules(doc[field])) return [];

  const moduleIds: string[] = [];
  for (const country of getCountries(doc.country)) {
    const moduleId = moduleIdsBySlug.get(country);
    if (moduleId) {
      moduleIds.push(moduleId);
    } else {
      payload.logger.warn(
        `backfill: ${collection} ${doc.id} names country ${country}, which has no module, left as is`,
      );
    }
  }

  return moduleIds;
}

const backfillTarget = async (
  payload: Payload,
  moduleIdsBySlug: Map<string, string>,
  target: Target,
): Promise<string> => {
  const db = payload.db as unknown as PostgresAdapter;
  const { collection } = target;
  const [{ docs }, { docs: versions }] = await Promise.all([
    payload.find({ collection, where: { country: { exists: true } }, depth: 0, pagination: false }),
    payload.findVersions({
      collection,
      where: { "version.country": { exists: true } },
      depth: 0,
      pagination: false,
    }),
  ]);

  let backfilled = 0;
  for (const doc of docs as unknown as CountryDoc[]) {
    const moduleIds = getMissingModuleIds(payload, moduleIdsBySlug, target, doc);
    if (!moduleIds.length) continue;

    await target.writeDoc(db, doc.id, moduleIds);
    backfilled++;
  }

  let backfilledVersions = 0;
  for (const { id, version } of versions as unknown as { id: string; version: CountryDoc }[]) {
    const moduleIds = getMissingModuleIds(payload, moduleIdsBySlug, target, version);
    if (!moduleIds.length) continue;

    await target.writeVersion(db, id, moduleIds);
    backfilledVersions++;
  }

  return `${backfilled} ${collection} (${backfilledVersions} versions)`;
};

export const backfillModules = async (payload: Payload): Promise<void> => {
  const moduleIdsBySlug = await getModuleIdsBySlug(payload);

  const counts: string[] = [];
  for (const target of TARGETS) {
    counts.push(await backfillTarget(payload, moduleIdsBySlug, target));
  }

  payload.logger.info(`Backfilled modules: ${counts.join(", ")}.`);
};
