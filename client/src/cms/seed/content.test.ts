import { seedContent } from "./content";
import { createFakePayload } from "./test-support";
import type { ContentDataset, RichText } from "./types";

/** Rich text is opaque here — prepare-seed's tests covered its shape. */
const richText = (text: string) => ({ root: { children: [{ text }] } }) as unknown as RichText;

const dataset = (): ContentDataset => ({
  topics: [
    {
      // The overview Topic. Its dataset number is 0, the value that used to make
      // this record unreachable in the admin.
      id: 0,
      _status: "published",
      name: { en: "Geographic context", es: "Contexto geográfico" },
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
      // The overview Topic and Subtopic 0 have layouts; Topic 1's is empty.
      layoutsAttached: 2,
    });
  });

  test("lets Payload mint the ids rather than supplying them", async () => {
    // A record id of 0 made the admin open the edit screen as a blank create form.
    const { payload, ids, calls } = createFakePayload();

    await seedContent({ payload, dataset: dataset() });

    expect(ids("topics")).toHaveLength(2);
    for (const id of ids("topics")) expect(id).toMatch(/^[0-9a-f-]{36}$/);
    // The fake throws on an explicit id, so reaching here proves none was sent.
    expect(calls.filter((call) => call.op === "create")).toHaveLength(4);
  });

  test("writes records published, not as drafts", async () => {
    // Seeded as drafts they show in the admin but are invisible to the public
    // site, which looks exactly like a caching problem.
    const { payload, named } = createFakePayload();

    await seedContent({ payload, dataset: dataset() });

    expect(named("topics", "Geographic context")._status).toBe("published");
    expect(named("subtopics", "Land cover")._status).toBe("published");
    expect(named("indicators", "Forest area")._status).toBe("published");
  });

  test("carries non-localized fields", async () => {
    const { payload, named } = createFakePayload();

    await seedContent({ payload, dataset: dataset() });

    expect(named("indicators", "Forest area")).toMatchObject({
      order: 1,
      visualizationTypes: ["map", "chart"],
    });
  });

  test("writes the data source as a single typed block", async () => {
    const { payload, named } = createFakePayload();

    await seedContent({ payload, dataset: dataset() });

    expect(named("indicators", "Forest area").dataSource).toEqual([
      { blockType: "h3", name: "forest", column: "forest_ha" },
    ]);
  });

  describe("relationships", () => {
    test("points a Subtopic at the uuid its Topic was given", async () => {
      const { payload, named } = createFakePayload();

      await seedContent({ payload, dataset: dataset() });

      expect(named("subtopics", "Land cover").topic).toBe(named("topics", "Geographic context").id);
    });

    test("points an Indicator at the uuid its Subtopic was given", async () => {
      const { payload, named } = createFakePayload();

      await seedContent({ payload, dataset: dataset() });

      expect(named("indicators", "Forest area").subtopic).toBe(named("subtopics", "Land cover").id);
    });

    test("points a layout tile at the uuid its Indicator was given", async () => {
      const { payload, named } = createFakePayload();

      await seedContent({ payload, dataset: dataset() });

      expect(named("topics", "Geographic context").defaultLayout).toEqual([
        { indicator: named("indicators", "Forest area").id, type: "map", x: 0, y: 0, w: 2, h: 2 },
      ]);
    });

    test("resolves a dataset number of 0, rather than reading it as absent", async () => {
      // Every reference in the miniature dataset is to number 0. A truthiness
      // check anywhere in the resolution path would drop the lot.
      const { payload, named } = createFakePayload();

      await seedContent({ payload, dataset: dataset() });

      expect(named("subtopics", "Land cover").topic).toBeDefined();
      expect(named("indicators", "Forest area").subtopic).toBeDefined();
    });
  });

  describe("dangling references", () => {
    test("refuses a Subtopic whose Topic the dataset never defines", async () => {
      const content = dataset();
      content.subtopics[0].topic = 42;
      const { payload } = createFakePayload();

      await expect(seedContent({ payload, dataset: content })).rejects.toThrow(/topic 42/);
    });

    test("refuses an Indicator whose Subtopic the dataset never defines", async () => {
      const content = dataset();
      content.indicators[0].subtopic = 99;
      const { payload } = createFakePayload();

      await expect(seedContent({ payload, dataset: content })).rejects.toThrow(/subtopic 99/);
    });

    test("refuses a layout tile pointing at an Indicator the dataset never defines", async () => {
      // Previously this could be written and only surfaced later as a Topic
      // rendering a hole. There is no uuid to write now, so it fails here.
      const content = dataset();
      content.topics[0].defaultLayout[0].indicatorId = 404;
      const { payload } = createFakePayload();

      await expect(seedContent({ payload, dataset: content })).rejects.toThrow(/indicator 404/);
    });
  });

  describe("locales", () => {
    test("writes a translation that differs from English", async () => {
      const { payload, named } = createFakePayload();

      await seedContent({ payload, dataset: dataset() });

      expect(named("indicators", "Área de bosque", "es").name).toBe("Área de bosque");
      expect(named("topics", "Contexto geográfico", "es").name).toBe("Contexto geográfico");
    });

    test("leaves an absent translation to fall back to English", async () => {
      // Sparse by design: Portuguese is not written for the overview Topic, so a
      // Portuguese reader resolves the English name rather than a blank.
      const { payload, named, calls } = createFakePayload();

      await seedContent({ payload, dataset: dataset() });

      expect(named("topics", "Geographic context", "pt").name).toBe("Geographic context");
      expect(calls.some((call) => call.collection === "topics" && call.locale === "pt")).toBe(
        false,
      );
    });

    test("writes each locale that is present", async () => {
      const { payload, named } = createFakePayload();

      await seedContent({ payload, dataset: dataset() });

      expect(named("subtopics", "Cobertura", "pt").name).toBe("Cobertura");
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

    test("skips records whose layout is empty", async () => {
      const { payload, named } = createFakePayload();

      await seedContent({ payload, dataset: dataset() });

      expect(named("topics", "Fires").defaultLayout).toBeUndefined();
    });
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
