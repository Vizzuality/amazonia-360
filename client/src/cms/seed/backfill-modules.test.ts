import type { Payload } from "payload";

import { backfillModules } from "./backfill-modules";

type Doc = { id: string; country?: string | string[] | null; [field: string]: unknown };
type Table = { name: string; id: string };
type Write = { table: string; values: unknown };

const TABLE_NAMES = ["indicators", "_indicators_v", "reports_rels", "_reports_v_rels"];

const getFakePayload = (docs: Record<string, Doc[]>, versions: Record<string, Doc[]> = {}) => {
  const writes: Write[] = [];
  const warnings: string[] = [];
  const localUpdate = vi.fn();
  const adapterUpdate = vi.fn();
  const tables = Object.fromEntries(TABLE_NAMES.map((name) => [name, { name, id: `${name}.id` }]));

  const payload = {
    logger: { warn: (message: string) => warnings.push(message), info: vi.fn() },
    find: async ({ collection }: { collection: string }) => ({
      docs: collection === "country-modules" ? [{ id: "m-ecu", slug: "ECU" }] : docs[collection],
    }),
    findVersions: async ({ collection }: { collection: string }) => ({
      docs: (versions[collection] ?? []).map((version) => ({ id: `v-${version.id}`, version })),
    }),
    update: localUpdate,
    db: {
      tables,
      updateOne: adapterUpdate,
      updateVersion: adapterUpdate,
      drizzle: {
        update: (table: Table) => ({
          set: (values: unknown) => ({
            where: async () => writes.push({ table: table.name, values }),
          }),
        }),
        insert: (table: Table) => ({
          values: async (values: unknown) => writes.push({ table: table.name, values }),
        }),
      },
    },
  } as unknown as Payload;

  return { payload, writes, warnings, localUpdate, adapterUpdate };
};

describe("backfillModules", () => {
  test("writes only the module column and relationship rows, never updatedAt", async () => {
    const { payload, writes, localUpdate, adapterUpdate } = getFakePayload({
      indicators: [{ id: "216", country: "ECU", module: null }],
      reports: [{ id: "r1", country: ["ECU"], modules: [] }],
    });

    await backfillModules(payload);

    expect(writes).toEqual([
      { table: "indicators", values: { module: "m-ecu" } },
      {
        table: "reports_rels",
        values: [{ parent: "r1", path: "modules", order: 1, "country-modulesID": "m-ecu" }],
      },
    ]);
    expect(localUpdate).not.toHaveBeenCalled();
    expect(adapterUpdate).not.toHaveBeenCalled();
  });

  test("backfills versions into their own tables", async () => {
    const { payload, writes } = getFakePayload(
      { indicators: [], reports: [] },
      {
        indicators: [{ id: "216", country: "ECU", module: null }],
        reports: [{ id: "r1", country: ["ECU"], modules: [] }],
      },
    );

    await backfillModules(payload);

    expect(writes).toEqual([
      { table: "_indicators_v", values: { version_module: "m-ecu" } },
      {
        table: "_reports_v_rels",
        values: [
          { parent: "v-r1", path: "version.modules", order: 1, "country-modulesID": "m-ecu" },
        ],
      },
    ]);
  });

  test("skips documents whose module is already set", async () => {
    const { payload, writes } = getFakePayload({
      indicators: [{ id: "216", country: "ECU", module: "m-other" }],
      reports: [{ id: "r1", country: ["ECU"], modules: ["m-other"] }],
    });

    await backfillModules(payload);

    expect(writes).toEqual([]);
  });

  test("warns on a country with no module and leaves the document as is", async () => {
    const { payload, writes, warnings } = getFakePayload({
      indicators: [{ id: "216", country: "BOL", module: null }],
      reports: [{ id: "r1", country: ["BOL", "ECU"], modules: [] }],
    });

    await backfillModules(payload);

    expect(warnings).toEqual([
      "backfill: indicators 216 names country BOL, which has no module, left as is",
      "backfill: reports r1 names country BOL, which has no module, left as is",
    ]);
    expect(writes).toEqual([
      {
        table: "reports_rels",
        values: [{ parent: "r1", path: "modules", order: 1, "country-modulesID": "m-ecu" }],
      },
    ]);
  });
});
