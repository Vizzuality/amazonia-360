import { readFileSync } from "node:fs";
import path from "node:path";

import { convertMarkdownToLexical } from "@payloadcms/richtext-lexical";

import { buildDataset } from "./dataset";
import { extractMarkdownLinks, extractRichTextLinks } from "./markdown";
import { createTestEditorConfig } from "./test-support";

const load = (name: string) =>
  JSON.parse(readFileSync(path.resolve(process.cwd(), "datum", name), "utf8"));

describe("buildDataset over the real content", () => {
  let editorConfig: Awaited<ReturnType<typeof createTestEditorConfig>>;
  let topics: Record<string, unknown>[];
  let subtopics: Record<string, unknown>[];
  let indicators: Record<string, unknown>[];
  let result: ReturnType<typeof buildDataset>;

  beforeAll(async () => {
    editorConfig = await createTestEditorConfig();
    topics = load("topics.json");
    subtopics = load("subtopics.json");
    indicators = load("indicators.json");
    result = buildDataset({ topics, subtopics, indicators, editorConfig });
  });

  test("converts the whole catalogue", () => {
    expect(result.dataset.topics).toHaveLength(9);
    expect(result.dataset.subtopics).toHaveLength(28);
    expect(result.dataset.indicators).toHaveLength(164);
  });

  test("no description loses a hyperlink", () => {
    // The rule that is not optional. Verified against every locale of every record.
    const lost: string[] = [];

    for (const [label, records] of [
      ["indicator", result.dataset.indicators],
      ["topic", result.dataset.topics],
      ["subtopic", result.dataset.subtopics],
    ] as const) {
      const source =
        records === result.dataset.indicators
          ? indicators
          : records === result.dataset.topics
            ? topics
            : subtopics;

      for (const record of records) {
        if (!record.description) continue;

        const raw = source.find((entry) => Number(entry.id) === record.id)!;

        for (const locale of ["en", "es", "pt"] as const) {
          const richText = record.description[locale];
          if (!richText) continue;

          const markdown = String(raw[`description_${locale}`] ?? "");
          const expected = new Set(extractMarkdownLinks(markdown));
          const actual = new Set(extractRichTextLinks(richText));

          for (const url of expected) {
            if (!actual.has(url)) lost.push(`${label} ${record.id} ${locale}: ${url}`);
          }
        }
      }
    }

    expect(lost).toEqual([]);
  });

  test("the autolink rewrite is load-bearing: without it links vanish at scale", () => {
    // Establishes why prepareMarkdown exists. Converting the raw source, with no
    // rewrite, silently drops the hyperlinks from every autolink-only field.
    let fieldsThatWouldLoseLinks = 0;

    for (const indicator of indicators) {
      for (const locale of ["en", "es", "pt"] as const) {
        const markdown = String(indicator[`description_${locale}`] ?? "");
        if (!markdown) continue;

        const expected = extractMarkdownLinks(markdown);
        if (!expected.length) continue;

        const naive = convertMarkdownToLexical({ editorConfig, markdown });
        const actual = new Set(extractRichTextLinks(naive));

        if (expected.some((url) => !actual.has(url))) fieldsThatWouldLoseLinks += 1;
      }
    }

    // 220 description fields contain hyperlinks; 192 of them would lose every
    // one. Pinned exactly: the source content is committed and static, so a
    // change here means the content changed and someone should look.
    expect(fieldsThatWouldLoseLinks).toBe(192);
  });

  test("every record keeps its original id and is published", () => {
    const all = [
      ...result.dataset.topics,
      ...result.dataset.subtopics,
      ...result.dataset.indicators,
    ];

    expect(all.every((record) => Number.isInteger(record.id))).toBe(true);
    expect(all.every((record) => record._status === "published")).toBe(true);

    expect(result.dataset.indicators.map((i) => i.id).sort((a, b) => a - b)).toEqual(
      indicators.map((i) => Number(i.id)).sort((a, b) => a - b),
    );
  });

  test("obsolete source fields are gone", () => {
    const serialised = JSON.stringify(result.dataset);

    expect(serialised).not.toContain("Numerotation");
    expect(serialised).not.toContain('"Active"');
    // The Subtopic image field is empty everywhere and unused by the app.
    expect(result.dataset.subtopics.every((s) => !("image" in s))).toBe(true);
  });

  test("each data source carries only its own kind's attributes", () => {
    for (const indicator of result.dataset.indicators) {
      const source = indicator.dataSource;

      if (source.kind === "feature") {
        expect(source).not.toHaveProperty("rasterFunction");
        expect(source).not.toHaveProperty("legend");
        expect(source).not.toHaveProperty("column");
      }
      if (source.kind === "imagery") {
        expect(source).not.toHaveProperty("queries");
        expect(source).not.toHaveProperty("layerId");
        expect(source).not.toHaveProperty("column");
      }
      if (source.kind === "h3") {
        expect(source).not.toHaveProperty("queries");
        expect(source).not.toHaveProperty("legend");
      }
    }
  });

  test("drops the layout entry pointing at the missing Indicator 55", () => {
    expect(result.droppedLayoutEntries).toEqual([{ owner: "Subtopic 26", indicatorId: 55 }]);

    const layouts = [...result.dataset.topics, ...result.dataset.subtopics].flatMap(
      (record) => record.defaultLayout,
    );
    const knownIds = new Set(result.dataset.indicators.map((i) => i.id));

    expect(layouts.every((entry) => knownIds.has(entry.indicatorId))).toBe(true);
  });

  test("keeps the overview Topic's deliberate cross-topic references", () => {
    const overview = result.dataset.topics.find((topic) => topic.id === 0)!;
    const subtopicsByTopic = new Map(result.dataset.subtopics.map((s) => [s.id, s.topic]));
    const indicatorTopic = new Map(
      result.dataset.indicators.map((i) => [i.id, subtopicsByTopic.get(i.subtopic)]),
    );

    const referencedTopics = new Set(
      overview.defaultLayout.map((entry) => indicatorTopic.get(entry.indicatorId)),
    );

    expect(overview.defaultLayout.length).toBeGreaterThan(0);
    // Pulls from more than just its own Topic, which is the behaviour to protect.
    expect(referencedTopics.size).toBeGreaterThan(1);
  });

  test("translations are sparse: no locale duplicates English", () => {
    for (const indicator of result.dataset.indicators) {
      const raw = indicators.find((entry) => Number(entry.id) === indicator.id)!;

      for (const locale of ["es", "pt"] as const) {
        if (indicator.name?.[locale] !== undefined) {
          expect(indicator.name[locale]).not.toBe(raw.name_en);
        }
        if (indicator.unit?.[locale] !== undefined) {
          expect(indicator.unit[locale]).not.toBe(raw.unit_en);
        }
      }
    }
  });

  test("names, short descriptions and units stay plain text", () => {
    for (const indicator of result.dataset.indicators) {
      expect(typeof indicator.name.en).toBe("string");
      if (indicator.descriptionShort) expect(typeof indicator.descriptionShort.en).toBe("string");
      if (indicator.unit) expect(typeof indicator.unit.en).toBe("string");
      // Descriptions, by contrast, are rich text documents.
      if (indicator.description) expect(indicator.description.en).toHaveProperty("root");
    }
  });

  test("is reproducible: building twice yields identical output", () => {
    const again = buildDataset({ topics, subtopics, indicators, editorConfig });

    expect(JSON.stringify(again.dataset)).toBe(JSON.stringify(result.dataset));
  });

  test("reports a fidelity finding for every field whose rendering changes", () => {
    expect(result.findings.length).toBeGreaterThan(0);
    // Each finding must carry both sides so a human can judge it.
    for (const finding of result.findings) {
      expect(finding.where).toMatch(/\S/);
      expect(finding.issues.length).toBeGreaterThan(0);
      expect(typeof finding.before).toBe("string");
      expect(typeof finding.after).toBe("string");
    }
  });

  test("each fidelity finding is reported once", () => {
    const seen = result.findings.map((finding) => finding.where);
    expect(seen).toHaveLength(new Set(seen).size);
  });
});
