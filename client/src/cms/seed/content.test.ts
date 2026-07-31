import { seedContent } from "./content";
import { createFakePayload } from "./test-support";
import type { ContentDataset, RichText } from "./types";

/** Rich text is opaque here — prepare-seed's tests covered its shape. */
const richText = (text: string) => ({ root: { children: [{ text }] } }) as unknown as RichText;

const dataset = (): ContentDataset => ({
  topics: [
    {
      // Topic 0 is the real overview Topic. Its id is falsy, which is the case
      // Payload's update silently mishandles.
      id: 0,
      _status: "published",
      name: { en: "Overview", es: "Resumen" },
      description: { en: richText("All topics") },
      defaultLayout: [{ indicatorId: 0, type: "map", x: 0, y: 0, w: 2, h: 2 }],
    },
    {
      id: 1,
      _status: "published",
      name: { en: "Fires" },
      defaultLayout: [],
    },
  ],
  subtopics: [
    {
      id: 0,
      _status: "published",
      topic: 0,
      name: { en: "Land cover", pt: "Cobertura" },
      defaultLayout: [{ indicatorId: 0, type: "chart", x: 0, y: 0, w: 1, h: 1 }],
    },
  ],
  indicators: [
    {
      id: 0,
      _status: "published",
      subtopic: 0,
      order: 1,
      name: { en: "Forest area", es: "Área de bosque" },
      description: { en: richText("Hectares of forest") },
      descriptionShort: { en: "Forest" },
      unit: { en: "ha" },
      visualizationTypes: ["map", "chart"],
      dataSource: { kind: "h3", name: "forest", column: "forest_ha" },
    },
  ],
});

describe("seedContent", () => {
  test("reports what it wrote", async () => {
    const { payload } = createFakePayload();

    await expect(seedContent({ payload, dataset: dataset() })).resolves.toEqual({
      topics: 2,
      subtopics: 1,
      indicators: 1,
      // Topic 0 and Subtopic 0 have layouts; Topic 1's is empty and is skipped.
      layoutsAttached: 2,
    });
  });

  test("keeps original ids, including the falsy id 0", async () => {
    // Renumbering would break every saved report and shared report URL.
    const { payload, ids } = createFakePayload();

    await seedContent({ payload, dataset: dataset() });

    expect(ids("topics")).toEqual([0, 1]);
    expect(ids("subtopics")).toEqual([0]);
    expect(ids("indicators")).toEqual([0]);
  });

  test("writes records published, not as drafts", async () => {
    // Seeded as drafts they show in the admin but are invisible to the public
    // site, which looks exactly like a caching problem.
    const { payload, read } = createFakePayload();

    await seedContent({ payload, dataset: dataset() });

    expect(read("topics", 0)._status).toBe("published");
    expect(read("subtopics", 0)._status).toBe("published");
    expect(read("indicators", 0)._status).toBe("published");
  });

  test("carries non-localized fields", async () => {
    const { payload, read } = createFakePayload();

    await seedContent({ payload, dataset: dataset() });

    expect(read("subtopics", 0).topic).toBe(0);
    expect(read("indicators", 0)).toMatchObject({
      subtopic: 0,
      order: 1,
      visualizationTypes: ["map", "chart"],
    });
  });

  test("writes the data source as a single typed block", async () => {
    const { payload, read } = createFakePayload();

    await seedContent({ payload, dataset: dataset() });

    expect(read("indicators", 0).dataSource).toEqual([
      { blockType: "h3", name: "forest", column: "forest_ha" },
    ]);
  });

  describe("locales", () => {
    test("writes a translation that differs from English", async () => {
      const { payload, read } = createFakePayload();

      await seedContent({ payload, dataset: dataset() });

      expect(read("indicators", 0, "es").name).toBe("Área de bosque");
      expect(read("topics", 0, "es").name).toBe("Resumen");
    });

    test("leaves an absent translation to fall back to English", async () => {
      // Sparse by design: Portuguese is not written for Topic 0, so a Portuguese
      // reader resolves the English name rather than a blank.
      const { payload, read, calls } = createFakePayload();

      await seedContent({ payload, dataset: dataset() });

      expect(read("topics", 0, "pt").name).toBe("Overview");
      expect(calls.some((call) => call.collection === "topics" && call.locale === "pt")).toBe(
        false,
      );
    });

    test("writes each locale that is present", async () => {
      const { payload, read } = createFakePayload();

      await seedContent({ payload, dataset: dataset() });

      expect(read("subtopics", 0, "pt").name).toBe("Cobertura");
    });
  });

  describe("phasing", () => {
    test("attaches layouts only after every Indicator exists", async () => {
      // A layout tile is a relationship to an Indicator. Written during phase 1
      // it would point at a record that does not exist yet.
      const { payload, calls } = createFakePayload();

      await seedContent({ payload, dataset: dataset() });

      const lastIndicatorWrite = calls.findLastIndex(
        (call) =>
          call.collection === "indicators" && (call.op === "create" || call.op === "update"),
      );
      const layoutWrites = calls
        .map((call, index) => ({ call, index }))
        .filter(({ call }) => call.fields?.includes("defaultLayout"))
        .map(({ index }) => index);

      expect(layoutWrites.length).toBeGreaterThan(0);
      for (const index of layoutWrites) expect(index).toBeGreaterThan(lastIndicatorWrite);
    });

    test("stores layout tiles against the indicator relationship field", async () => {
      const { payload, read } = createFakePayload();

      await seedContent({ payload, dataset: dataset() });

      expect(read("topics", 0).defaultLayout).toEqual([
        { indicator: 0, type: "map", x: 0, y: 0, w: 2, h: 2 },
      ]);
    });

    test("skips records whose layout is empty", async () => {
      const { payload, read } = createFakePayload();

      await seedContent({ payload, dataset: dataset() });

      expect(read("topics", 1).defaultLayout).toBeUndefined();
    });
  });

  test("is idempotent — a second run updates rather than duplicates", async () => {
    const { payload, ids, read } = createFakePayload();

    await seedContent({ payload, dataset: dataset() });
    await seedContent({ payload, dataset: dataset() });

    expect(ids("topics")).toEqual([0, 1]);
    expect(ids("indicators")).toEqual([0]);
    expect(read("indicators", 0).name).toBe("Forest area");
  });

  describe("failure", () => {
    test("aborts rather than continuing past a failed write", async () => {
      // Continuing would report success on a partly written catalogue, which is
      // the one outcome worse than failing: nothing downstream would notice.
      const { payload } = createFakePayload({
        failOn: (call) =>
          call.collection === "indicators" && call.op === "create" ? "connection reset" : undefined,
      });

      await expect(seedContent({ payload, dataset: dataset() })).rejects.toThrow(
        "connection reset",
      );
    });

    test("handles an empty dataset without writing anything", async () => {
      const { payload, calls } = createFakePayload();
      const empty: ContentDataset = { topics: [], subtopics: [], indicators: [] };

      await expect(seedContent({ payload, dataset: empty })).resolves.toEqual({
        topics: 0,
        subtopics: 0,
        indicators: 0,
        layoutsAttached: 0,
      });
      expect(calls.filter((call) => call.op === "create" || call.op === "update")).toEqual([]);
    });
  });
});
