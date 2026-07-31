import { seedContent } from "./content";
import { createFakePayload } from "./test-support";
import type { ContentDataset, RichText } from "./types";
import { expectedFrom, verifySeed } from "./verify";

const richText = (text: string) => ({ root: { children: [{ text }] } }) as unknown as RichText;

/**
 * A miniature but structurally honest catalogue: two Topics, two Subtopics, two
 * Indicators, and a curated Topic whose layout crosses Topic boundaries — the
 * property the real *Geographic context* Topic has and that a naive migration
 * loses.
 */
const dataset = (): ContentDataset => ({
  topics: [
    {
      id: 0,
      _status: "published",
      name: { en: "Geographic context" },
      description: { en: richText("Everything") },
      defaultLayout: [
        { indicatorId: 0, type: "map", x: 0, y: 0, w: 1, h: 1 },
        { indicatorId: 1, type: "chart", x: 1, y: 0, w: 1, h: 1 },
      ],
    },
    { id: 1, _status: "published", name: { en: "Fires" }, defaultLayout: [] },
  ],
  subtopics: [
    { id: 0, _status: "published", topic: 0, name: { en: "Land cover" }, defaultLayout: [] },
    { id: 1, _status: "published", topic: 1, name: { en: "Hotspots" }, defaultLayout: [] },
  ],
  indicators: [
    {
      id: 0,
      _status: "published",
      subtopic: 0,
      order: 1,
      name: { en: "Forest area" },
      visualizationTypes: ["map"],
      dataSource: { kind: "h3", name: "forest", column: "forest_ha" },
    },
    {
      id: 1,
      _status: "published",
      subtopic: 1,
      order: 1,
      name: { en: "Fire count" },
      visualizationTypes: ["chart"],
      dataSource: { kind: "h3", name: "fires", column: "fire_count" },
    },
  ],
});

const seeded = async (content: ContentDataset = dataset()) => {
  const fake = createFakePayload();
  await seedContent({ payload: fake.payload, dataset: content });
  return fake;
};

describe("expectedFrom", () => {
  test("takes the expected counts from the dataset, not a hardcoded number", async () => {
    expect(expectedFrom(dataset())).toEqual({ topics: 2, subtopics: 2, indicators: 2 });
  });
});

describe("verifySeed", () => {
  test("passes on a correctly seeded database", async () => {
    const content = dataset();
    const { payload } = await seeded(content);

    const { problems } = await verifySeed({ payload, expected: expectedFrom(content) });

    expect(problems).toEqual([]);
  });

  test("reports what it checked even when everything passes", async () => {
    const content = dataset();
    const { payload } = await seeded(content);

    const { lines } = await verifySeed({ payload, expected: expectedFrom(content) });

    expect(lines.join("\n")).toContain("2 topics, 2 subtopics, 2 indicators");
    expect(lines.join("\n")).toContain("every record published and keyed by a uuid");
  });

  test("catches a short count", async () => {
    // The Payload pagination trap: a seed that wrote 10 of 164 reports success.
    const content = dataset();
    const { payload } = await seeded(content);

    const { problems } = await verifySeed({
      payload,
      expected: { ...expectedFrom(content), indicators: 164 },
    });

    expect(problems).toContainEqual("indicators: expected 164 from the dataset, found 2");
  });

  test("catches an Indicator orphaned from its Subtopic", async () => {
    // What a Subtopic deleted from under its children looks like: the
    // relationship is set null and the Indicator falls out of the hierarchy.
    const fake = await seeded();
    fake.preload("indicators", [{ name: "Orphan", subtopic: null, _status: "published" }]);

    const { problems } = await verifySeed({
      payload: fake.payload,
      expected: { topics: 2, subtopics: 2, indicators: 3 },
    });

    expect(problems).toContainEqual('indicator "Orphan" -> missing subtopic');
  });

  test("catches a Subtopic orphaned from its Topic", async () => {
    const fake = await seeded();
    fake.preload("subtopics", [{ name: "Orphan", topic: null, _status: "published" }]);

    const { problems } = await verifySeed({
      payload: fake.payload,
      expected: { topics: 2, subtopics: 3, indicators: 2 },
    });

    expect(problems).toContainEqual('subtopic "Orphan" -> missing topic');
  });

  test("catches a layout tile pointing at a missing Indicator", async () => {
    // What a deleted Indicator looks like downstream: the catalogue is fine, but a
    // Topic renders a hole. Only an editor's delete can get you here now.
    const fake = await seeded();
    fake.preload("topics", [
      { name: "Hand made", _status: "published", defaultLayout: [{ indicator: null }] },
    ]);

    const { problems } = await verifySeed({
      payload: fake.payload,
      expected: { topics: 3, subtopics: 2, indicators: 2 },
    });

    expect(problems).toContainEqual('layout of "Hand made" -> missing indicator');
  });

  test("catches the curated layout being flattened to a single Topic", async () => {
    // Geographic context deliberately pulls Indicators from several Topics. A
    // prepare step that filtered layout entries to same-Topic Indicators would
    // silently flatten it.
    const content = dataset();
    content.topics[0].defaultLayout = [{ indicatorId: 0, type: "map", x: 0, y: 0, w: 1, h: 1 }];
    const { payload } = await seeded(content);

    const { problems } = await verifySeed({ payload, expected: expectedFrom(content) });

    expect(problems).toContainEqual("no Topic layout crosses Topic boundaries any more");
  });

  test("counts how many Topics the widest layout spans", async () => {
    const content = dataset();
    const { payload } = await seeded(content);

    const { lines } = await verifySeed({ payload, expected: expectedFrom(content) });

    expect(lines.join("\n")).toContain("pulls Indicators from 2 different Topics");
  });

  test("catches a record that is not keyed by a uuid", async () => {
    // A numeric key made the record numbered 0 open as a blank create form, so a
    // slide back has to be loud.
    const fake = await seeded();
    fake.preload("topics", [{ id: "0", name: "Numbered", _status: "published" }]);

    const { problems } = await verifySeed({
      payload: fake.payload,
      expected: { topics: 3, subtopics: 2, indicators: 2 },
    });

    expect(problems).toContainEqual("topics: 1 record(s) not keyed by a uuid");
  });

  describe("drafts", () => {
    test("does not fault a published record that has a pending draft revision", async () => {
      // One real Indicator is in exactly this state on a live database: published
      // and publicly visible, with a newer unpublished edit on top. Querying the
      // draft view returns that revision, so an earlier version of this check
      // reported it as "left as draft" and would have failed a deploy over
      // somebody's unsaved work.
      const content = dataset();
      const fake = await seeded(content);
      fake.setPendingDraft("indicators", fake.ids("indicators")[0]);

      const { problems } = await verifySeed({
        payload: fake.payload,
        expected: expectedFrom(content),
      });

      expect(problems).toEqual([]);
    });

    test("reports the pending draft, without calling it a problem", async () => {
      const content = dataset();
      const fake = await seeded(content);
      fake.setPendingDraft("indicators", fake.ids("indicators")[0]);

      const { lines } = await verifySeed({
        payload: fake.payload,
        expected: expectedFrom(content),
      });

      expect(lines.join("\n")).toContain("1 record(s) with an unpublished draft revision");
    });
  });

  test("catches a locale resolving to a blank name", async () => {
    // The sparse-translation failure mode: a locale written as empty rather than
    // omitted does not fall back, so the reader gets a blank.
    const content = dataset();
    content.indicators[0].name = { en: "", es: "Área de bosque" };
    const { payload } = await seeded(content);

    const { problems } = await verifySeed({ payload, expected: expectedFrom(content) });

    expect(problems.some((problem) => problem.includes("blank indicator name"))).toBe(true);
  });
});
