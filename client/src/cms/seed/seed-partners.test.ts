import type { Payload } from "payload";

import { seedPartners } from "./seed-partners";
import type { RawPartner } from "./utils/types";

const raw = (over: Partial<RawPartner> = {}): RawPartner => ({
  name: "Esri",
  logo_en: "/partners/esri.avif",
  logo_es: "/partners/esri.avif",
  logo_pt: "/partners/esri.avif",
  regional: true,
  modules: [],
  order: 4,
  ...over,
});

type Call = { id?: string; locale?: string; data: Record<string, unknown> };

const fakePayload = (existingId?: string) => {
  const created: Call[] = [];
  const updated: Call[] = [];
  const warnings: string[] = [];

  const payload = {
    logger: {
      warn: (message: string) => warnings.push(message),
    },
    find: async ({ collection }: { collection: string }) => {
      if (collection === "country-modules") return { docs: [{ id: "7", slug: "ECU" }] };
      return { docs: existingId ? [{ id: existingId }] : [] };
    },
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

describe("seedPartners", () => {
  test("creates a partner with defaults and empty optional fields", async () => {
    const { payload, created } = fakePayload();

    await seedPartners(payload, [raw()]);

    expect(created[0].data).toEqual({
      name: "Esri",
      label: null,
      tag: null,
      logo: "/partners/esri.avif",
      logoSize: "default",
      regional: true,
      modules: [],
      order: 4,
    });
  });

  test("resolves module slugs to ids", async () => {
    const { payload, created } = fakePayload();

    await seedPartners(payload, [
      raw({ name: "MAE", label: "MAE", tag: "MAE", regional: false, modules: ["ECU"] }),
    ]);

    expect(created[0].data).toMatchObject({ modules: ["7"], label: "MAE", tag: "MAE" });
  });

  test("updates the partner found by name and writes per-locale logos", async () => {
    const { payload, created, updated } = fakePayload("5");

    await seedPartners(payload, [
      raw({ name: "ACTO ARO", logo_en: "/a-en", logo_es: "/a-es", logo_pt: "/a-pt" }),
    ]);

    expect(created).toHaveLength(0);
    expect(updated[0]).toMatchObject({ id: "5", data: { logo: "/a-en" } });
    expect(updated.find(({ locale }) => locale === "es")?.data).toEqual({ logo: "/a-es" });
    expect(updated.find(({ locale }) => locale === "pt")?.data).toEqual({ logo: "/a-pt" });
  });

  test("throws when a module slug is unknown", async () => {
    const { payload, created } = fakePayload();

    await expect(seedPartners(payload, [raw({ modules: ["XXX"] })])).rejects.toThrow(
      "names unknown country module XXX",
    );
    expect(created).toHaveLength(0);
  });

  test("skips a duplicate name with a warning", async () => {
    const { payload, created, warnings } = fakePayload();

    await seedPartners(payload, [raw(), raw()]);

    expect(created).toHaveLength(1);
    expect(warnings).toEqual(["partners: duplicate name Esri, skipped"]);
  });
});
