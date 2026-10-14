import type { Payload } from "payload";

import { seedCountryModules } from "./seed-country-modules";
import type { RawCountryModule } from "./utils/types";

const raw: RawCountryModule = {
  slug: "ECU",
  country: "ECU",
  active: true,
  tag: "ECU",
  order: 0,
  bbox: { xmin: 1, ymin: 2, xmax: 3, ymax: 4 },
  name_en: "Ecuador",
  name_es: "Ecuador",
  name_pt: "Equador",
  moduleName_en: "Ecuador Amazonia",
  moduleName_es: "Amazonía Ecuatoriana",
  moduleName_pt: "Amazônia Equatoriana",
  partnersDescription_en: "",
  partnersDescription_es: "",
  partnersDescription_pt: "",
};

type Call = { id?: string; locale?: string; data: Record<string, unknown> };

const fakePayload = (existingId?: string) => {
  const created: Call[] = [];
  const updated: Call[] = [];
  const warnings: string[] = [];

  const payload = {
    logger: { warn: (message: string) => warnings.push(message) },
    find: async () => ({ docs: existingId ? [{ id: existingId }] : [] }),
    create: async ({ data }: Call) => {
      created.push({ data });
      return { id: "new" };
    },
    update: async (args: Call) => {
      updated.push(args);
      return {};
    },
  } as unknown as Payload;

  return { payload, created, updated, warnings };
};

describe("seedCountryModules", () => {
  test("creates a module that does not exist yet, then writes the other locales", async () => {
    const { payload, created, updated } = fakePayload();

    await seedCountryModules(payload, [raw]);

    expect(created).toHaveLength(1);
    expect(created[0].data).toMatchObject({
      slug: "ECU",
      active: true,
      name: "Ecuador",
      bbox: { xmin: 1, ymin: 2, xmax: 3, ymax: 4 },
      partnersDescription: null,
    });
    expect(updated.map(({ id, locale }) => [id, locale])).toEqual([
      ["new", "es"],
      ["new", "pt"],
    ]);
    expect(updated.find(({ locale }) => locale === "pt")?.data).toMatchObject({
      name: "Equador",
      partnersDescription: null,
    });
  });

  test("updates the module found by slug instead of creating a duplicate", async () => {
    const { payload, created, updated } = fakePayload("3");

    await seedCountryModules(payload, [{ ...raw, bbox: undefined }]);

    expect(created).toHaveLength(0);
    expect(updated[0]).toMatchObject({
      id: "3",
      data: { slug: "ECU", bbox: { xmin: null, ymin: null, xmax: null, ymax: null } },
    });
    expect(updated[0].data).not.toHaveProperty("active");
  });

  test("skips a duplicate slug with a warning", async () => {
    const { payload, created, warnings } = fakePayload();

    await seedCountryModules(payload, [raw, raw]);

    expect(created).toHaveLength(1);
    expect(warnings).toEqual(["country-modules: duplicate slug ECU, skipped"]);
  });
});
