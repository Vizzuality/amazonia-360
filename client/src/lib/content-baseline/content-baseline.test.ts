import FIXTURE from "./baseline.fixture.json";
import { buildContentBaseline } from "./build";
import { BASELINE_LOCALES } from "./digest";
import type { ContentBaseline } from "./digest";

/**
 * Golden baseline for the Topic / Subtopic / Indicator lookups (AM-665).
 *
 * Around 70 files read this content and every one of them goes through those
 * three lookups, so pinning the lookups protects all of them. This exists to
 * prove the CMS migration changes where content comes from without changing
 * what users see.
 *
 * The fixture is committed data, deliberately not a Vitest snapshot: there is
 * no `-u` that can quietly rewrite it. Regenerating it is a conscious act and
 * the diff has to be read. If a change here is intended, say so in review.
 */

const baseline = FIXTURE as unknown as ContentBaseline;

/** Reports which ids appeared or vanished before falling back to deep equality. */
const expectSameIds = (label: string, actual: readonly number[], expected: readonly number[]) => {
  const actualSet = new Set(actual);
  const expectedSet = new Set(expected);
  const missing = expected.filter((id) => !actualSet.has(id));
  const added = actual.filter((id) => !expectedSet.has(id));

  expect(
    { missing, added },
    `${label}: ids drifted from the baseline. Missing ids are content that disappeared; added ids are content that appeared.`,
  ).toEqual({ missing: [], added: [] });

  // Same membership, so any remaining difference is ordering.
  expect(actual, `${label}: ids are the same but the order changed`).toEqual(expected);
};

describe("content baseline", () => {
  let actual: ContentBaseline;

  beforeAll(async () => {
    actual = await buildContentBaseline();
  });

  test("collection sizes are unchanged", () => {
    expect(actual.counts).toEqual(baseline.counts);
  });

  test("indicator structure is unchanged", () => {
    expectSameIds(
      "structure.indicators",
      actual.structure.indicators.map((i) => i.id),
      baseline.structure.indicators.map((i) => i.id),
    );

    // Per-indicator so a failure names the offending indicator rather than
    // printing the whole catalogue.
    for (const expected of baseline.structure.indicators) {
      const found = actual.structure.indicators.find((i) => i.id === expected.id);
      expect(found, `indicator ${expected.id} is missing`).toBeDefined();
      expect(found, `indicator ${expected.id} changed`).toEqual(expected);
    }
  });

  test("topic and subtopic structure and hierarchy are unchanged", () => {
    expectSameIds(
      "structure.topics",
      actual.structure.topics.map((t) => t.id),
      baseline.structure.topics.map((t) => t.id),
    );
    expectSameIds(
      "structure.subtopics",
      actual.structure.subtopics.map((s) => s.id),
      baseline.structure.subtopics.map((s) => s.id),
    );

    for (const expected of baseline.structure.topics) {
      const found = actual.structure.topics.find((t) => t.id === expected.id);
      expect(found, `topic ${expected.id} changed`).toEqual(expected);
    }

    for (const expected of baseline.structure.subtopics) {
      const found = actual.structure.subtopics.find((s) => s.id === expected.id);
      expect(found, `subtopic ${expected.id} changed`).toEqual(expected);
    }
  });

  describe.each(BASELINE_LOCALES)("locale %s", (locale) => {
    test("ordering is unchanged", () => {
      const expected = baseline.locales[locale];
      const found = actual.locales[locale];

      expectSameIds(`${locale} topicOrder`, found.topicOrder, expected.topicOrder);
      expectSameIds(`${locale} subtopicOrder`, found.subtopicOrder, expected.subtopicOrder);
      expectSameIds(`${locale} indicatorOrder`, found.indicatorOrder, expected.indicatorOrder);
    });

    test("resolved text is unchanged", () => {
      const expected = baseline.locales[locale];
      const found = actual.locales[locale];

      expect(found.topicText).toEqual(expected.topicText);
      expect(found.subtopicText).toEqual(expected.subtopicText);

      for (const entry of expected.indicatorText) {
        const match = found.indicatorText.find((t) => t.id === entry.id);
        expect(match, `indicator ${entry.id} text changed in ${locale}`).toEqual(entry);
      }
    });
  });

  test("every locale resolves a name for every indicator", () => {
    // The migration stores translations sparsely and leans on fallback, so a
    // blank name is the failure mode to watch for.
    for (const locale of BASELINE_LOCALES) {
      const blank = actual.locales[locale].indicatorText
        .filter((entry) => entry.name === "<empty>" || entry.name === "<absent>")
        .map((entry) => entry.id);
      expect(blank, `${locale} has indicators with no resolvable name`).toEqual([]);
    }
  });
});
