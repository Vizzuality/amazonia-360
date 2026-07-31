import dataset from "./data/content.json";
import type { ContentDataset } from "./types";
import { expectedFrom } from "./verify";

/**
 * Proves the shipped dataset is importable and intact.
 *
 * `pnpm seed` and `pnpm seed:verify` both reach it through this exact module
 * path, and both only fail at the point they are run against a real database —
 * by which time it is a deploy step failing, not a test. This is the cheap check
 * that the file is where the scripts expect and holds the whole catalogue.
 */

const content = dataset as unknown as ContentDataset;

describe("seed dataset", () => {
  test("imports from the path the seed scripts use", () => {
    expect(content).toBeDefined();
    expect(Array.isArray(content.topics)).toBe(true);
  });

  test("holds the full catalogue", () => {
    // Nine Topics, 28 Subtopics, 164 Indicators. A short count here means the
    // prepare-seed emitted a partial dataset.
    expect(expectedFrom(content)).toEqual({ topics: 9, subtopics: 28, indicators: 164 });
  });

  test("still numbers a Topic 0, the reference a truthiness check would drop", () => {
    // Number 0 is no longer a record id, but it is still a reference the seeder
    // has to resolve, and `if (number)` would silently skip it.
    expect(content.topics.map((topic) => topic.id)).toContain(0);
  });

  test("is entirely published", () => {
    const notPublished = [...content.topics, ...content.subtopics, ...content.indicators].filter(
      (record) => record._status !== "published",
    );

    expect(notPublished).toEqual([]);
  });

  test("has every Subtopic under a real Topic and every Indicator under a real Subtopic", () => {
    const topicIds = new Set(content.topics.map((topic) => topic.id));
    const subtopicIds = new Set(content.subtopics.map((subtopic) => subtopic.id));

    expect(content.subtopics.filter((subtopic) => !topicIds.has(subtopic.topic))).toEqual([]);
    expect(
      content.indicators
        .filter((indicator) => !subtopicIds.has(indicator.subtopic))
        .map((i) => i.id),
    ).toEqual([]);
  });

  test("has every layout tile pointing at an Indicator that exists", () => {
    const indicatorIds = new Set(content.indicators.map((indicator) => indicator.id));
    const dangling = [...content.topics, ...content.subtopics].flatMap((record) =>
      record.defaultLayout
        .filter((entry) => !indicatorIds.has(entry.indicatorId))
        .map((entry) => `${record.id} -> ${entry.indicatorId}`),
    );

    expect(dangling).toEqual([]);
  });
});
