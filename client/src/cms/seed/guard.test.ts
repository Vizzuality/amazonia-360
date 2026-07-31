import { assertSafeToSeed, countSeeded, describeCounts, isEmpty } from "./guard";
import { createFakePayload } from "./test-support";

describe("assertSafeToSeed", () => {
  test("allows an empty database", async () => {
    const { payload } = createFakePayload();

    await expect(assertSafeToSeed({ payload })).resolves.toEqual({
      topics: 0,
      subtopics: 0,
      indicators: 0,
    });
  });

  test("refuses a populated database", async () => {
    // The case this exists for: the CMS is live, an editor has been correcting
    // descriptions, and someone re-runs the seed. Upserting by id would restore
    // the dataset over the top of their work with no warning.
    const { payload, preload } = createFakePayload();
    preload("topics", [{ id: 0 }, { id: 1 }]);
    preload("indicators", [{ id: 7 }]);

    await expect(assertSafeToSeed({ payload })).rejects.toThrow(/Refusing to seed/);
  });

  test("names what it found, so the operator can tell a half-seed from live content", async () => {
    const { payload, preload } = createFakePayload();
    preload("topics", [{ id: 0 }]);
    preload("subtopics", [{ id: 0 }, { id: 1 }]);

    await expect(assertSafeToSeed({ payload })).rejects.toThrow(
      /1 topics, 2 subtopics, 0 indicators/,
    );
  });

  test("points at the escape hatch rather than just failing", async () => {
    const { payload, preload } = createFakePayload();
    preload("topics", [{ id: 0 }]);

    await expect(assertSafeToSeed({ payload })).rejects.toThrow(/pnpm seed --force/);
  });

  test("force overrides a populated database", async () => {
    const { payload, preload } = createFakePayload();
    preload("indicators", [{ id: 3 }]);

    await expect(assertSafeToSeed({ payload, force: true })).resolves.toEqual({
      topics: 0,
      subtopics: 0,
      indicators: 1,
    });
  });

  test("refuses a partially seeded database too", async () => {
    // A seed that died after Topics and a database an editor is working in look
    // identical from here. Only a person can tell them apart, so it stops.
    const { payload, preload } = createFakePayload();
    preload("topics", [{ id: 0 }]);

    await expect(assertSafeToSeed({ payload })).rejects.toThrow(/Refusing to seed/);
  });
});

describe("countSeeded", () => {
  test("counts each collection independently", async () => {
    const { payload, preload } = createFakePayload();
    preload("topics", [{ id: 0 }, { id: 1 }]);
    preload("indicators", [{ id: 0 }, { id: 1 }, { id: 2 }]);

    await expect(countSeeded(payload)).resolves.toEqual({
      topics: 2,
      subtopics: 0,
      indicators: 3,
    });
  });
});

describe("isEmpty", () => {
  test("is true only when every collection is empty", () => {
    expect(isEmpty({ topics: 0, subtopics: 0, indicators: 0 })).toBe(true);
    expect(isEmpty({ topics: 0, subtopics: 0, indicators: 1 })).toBe(false);
  });
});

describe("describeCounts", () => {
  test("reads as a sentence fragment", () => {
    expect(describeCounts({ topics: 9, subtopics: 28, indicators: 164 })).toBe(
      "9 topics, 28 subtopics, 164 indicators",
    );
  });
});
