import type { Payload } from "payload";

import { seedIndicators } from "./seed-indicators";
import type { RawIndicator, RawResource } from "./utils/types";

const resource = {
  name: "layer",
  type: "feature",
  column: "",
  layer_id: "0",
  rasterFunction: "",
  legend: "",
  url: "https://example.test/FeatureServer",
  query_numeric: "",
  query_table: "",
  query_chart: "",
  query_ai: "",
  popupTemplate: "",
} as unknown as RawResource;

const row = (over: Partial<RawIndicator> & Pick<RawIndicator, "id">): RawIndicator => ({
  subtopic_id: 2,
  order: 1,
  name_en: "Protected Areas",
  name_es: "",
  name_pt: "",
  unit_en: "",
  unit_es: "",
  unit_pt: "",
  description_en: "",
  description_es: "",
  description_pt: "",
  description_short_en: "Short",
  description_short_es: "",
  description_short_pt: "",
  visualization_types: ["map"],
  default_visualization_type: "map",
  resource,
  ...over,
});

type Written = { id: string; data: Record<string, unknown> };

const fakePayload = () => {
  const written: Written[] = [];
  const existing = new Set<string>();
  const warnings: string[] = [];

  const payload = {
    logger: { warn: (message: string) => warnings.push(message), info: () => {} },
    findByID: async ({ collection, id }: { collection: string; id: string }) =>
      collection === "subtopics" || existing.has(id) ? { id } : null,
    create: async ({ data }: { data: Record<string, unknown> }) => {
      existing.add(data.id as string);
      written.push({ id: data.id as string, data });
      return data;
    },
    update: async () => ({}),
  } as unknown as Payload;

  return { payload, written, warnings };
};

const dataFor = (written: Written[], id: number) =>
  written.find((entry) => entry.id === String(id))?.data;

describe("seedIndicators", () => {
  test("writes the country module, and writes it empty for a regional row", async () => {
    const { payload, written } = fakePayload();

    await seedIndicators(payload, [row({ id: 11 }), row({ id: 216, country: "ECU" })]);

    expect(dataFor(written, 11)).toMatchObject({ country: null });
    expect(dataFor(written, 216)).toMatchObject({ country: "ECU" });
  });

  test("relates a replacement to the regional indicator it names", async () => {
    const { payload, written } = fakePayload();

    await seedIndicators(payload, [
      row({ id: 11 }),
      row({ id: 216, country: "ECU", replaces: 11 }),
    ]);

    expect(dataFor(written, 216)).toMatchObject({ replaces: "11" });
  });

  test("leaves replaces empty and warns when the row it names was never seeded", async () => {
    const { payload, written, warnings } = fakePayload();

    await seedIndicators(payload, [row({ id: 216, country: "ECU", replaces: 11 })]);

    expect(dataFor(written, 216)).toMatchObject({ replaces: null });
    expect(warnings).toEqual([
      "indicators: id 216 replaces 11, which is not a seeded regional indicator, left empty",
    ]);
  });

  test("resolves replaces whatever order the source rows arrive in", async () => {
    const { payload, written } = fakePayload();

    await seedIndicators(payload, [
      row({ id: 216, country: "ECU", replaces: 11 }),
      row({ id: 11 }),
    ]);

    expect(dataFor(written, 216)).toMatchObject({ replaces: "11" });
  });

  test("drops a replaces naming a country row, which filterOptions would reject mid-seed", async () => {
    const { payload, written, warnings } = fakePayload();

    await seedIndicators(payload, [
      row({ id: 208, country: "ECU" }),
      row({ id: 216, country: "ECU", replaces: 208 }),
    ]);

    expect(dataFor(written, 216)).toMatchObject({ replaces: null });
    expect(warnings).toEqual([
      "indicators: id 216 replaces 208, which is not a seeded regional indicator, left empty",
    ]);
  });

  test("clears a replacement the source dropped rather than leaving the old one standing", async () => {
    const { payload, written } = fakePayload();

    await seedIndicators(payload, [row({ id: 216, country: "ECU" })]);

    expect(dataFor(written, 216)).toMatchObject({ replaces: null });
  });
});
