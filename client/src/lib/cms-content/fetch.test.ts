import { MINIMUM_RECORDS, assertComplete, buildContentUrl, fetchContent } from "./fetch";

describe("buildContentUrl", () => {
  test("disables pagination, which is the failure this migration must avoid", () => {
    const url = buildContentUrl({ collection: "indicators", locale: "es" });

    // Without limit=0 Payload returns 10 of 164 and raises nothing.
    expect(url).toContain("limit=0");
    expect(url).toContain("locale=es");
    expect(url).toContain("fallback-locale=en");
    expect(url).toMatch(/^\/v1\/api\/indicators\?/);
  });

  test("reaches the Topic through the Subtopic, and trims what it drags along", () => {
    const url = decodeURIComponent(buildContentUrl({ collection: "indicators", locale: "en" }));

    expect(url).toContain("depth=2");
    expect(url).toContain("populate[subtopics][topic]=true");
    expect(url).toContain("populate[topics][name]=true");
  });

  test.each(["topics", "subtopics"] as const)(
    "reads %s flat, since depth 0 already returns the relationship as the id the app wants",
    (collection) => {
      expect(buildContentUrl({ collection, locale: "en" })).toContain("depth=0");
    },
  );

  test("sets depth explicitly on every collection rather than inheriting the config default", () => {
    for (const collection of ["topics", "subtopics", "indicators"] as const) {
      expect(buildContentUrl({ collection, locale: "en" })).toMatch(/[?&]depth=\d/);
    }
  });

  test("never asks the CMS to sort, since varchar ids sort lexicographically", () => {
    for (const collection of ["topics", "subtopics", "indicators"] as const) {
      expect(buildContentUrl({ collection, locale: "en" })).not.toContain("sort=");
    }
  });

  test("accepts an absolute base for a caller that is not the browser", () => {
    expect(
      buildContentUrl({
        collection: "topics",
        locale: "en",
        baseUrl: "http://localhost:4000/v1/api",
      }),
    ).toMatch(/^http:\/\/localhost:4000\/v1\/api\/topics\?/);
  });
});

describe("assertComplete", () => {
  const docs = (count: number) => new Array(count).fill({});

  test("returns the docs when the catalogue is whole", () => {
    expect(assertComplete("topics", { docs: docs(9), totalDocs: 9 })).toHaveLength(9);
  });

  test("refuses a paginated response rather than silently losing records", () => {
    expect(() =>
      assertComplete("indicators", { docs: docs(10), totalDocs: 164, hasNextPage: true }),
    ).toThrow(/paginated \(10 of 164\)/);
  });

  test("refuses a short response even when the API reports it as complete", () => {
    // totalDocs is counted after access control filters drafts out, so an unpublished
    // Indicator reports 163 of 163 — a check reading its own total would pass this.
    expect(() => assertComplete("indicators", { docs: docs(163), totalDocs: 163 })).toThrow(
      /got 163 records, expected at least 164/,
    );
  });

  test("lets editors add records", () => {
    expect(assertComplete("indicators", { docs: docs(165), totalDocs: 165 })).toHaveLength(165);
  });

  test("rejects a malformed response", () => {
    expect(() => assertComplete("topics", {} as never)).toThrow(/no docs array/);
  });

  test("holds the counts the catalogue moved into the CMS with", () => {
    expect(MINIMUM_RECORDS).toEqual({ topics: 9, subtopics: 28, indicators: 164 });
  });
});

describe("fetchContent", () => {
  const respondWith = (body: unknown) =>
    vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => body } as Response);

  test("returns every record", async () => {
    const fetchImpl = respondWith({ docs: new Array(9).fill({ id: "0" }), totalDocs: 9 });

    await expect(
      fetchContent({ collection: "topics", locale: "en", fetchImpl: fetchImpl as never }),
    ).resolves.toHaveLength(9);
  });

  test("throws on a failed request instead of returning nothing", async () => {
    const fetchImpl = vi.fn().mockResolvedValue({ ok: false, status: 500 } as Response);

    await expect(
      fetchContent({ collection: "indicators", locale: "en", fetchImpl: fetchImpl as never }),
    ).rejects.toThrow(/failed with 500/);
  });

  test("throws when the catalogue comes back truncated", async () => {
    const fetchImpl = respondWith({
      docs: new Array(10).fill({}),
      totalDocs: 164,
      hasNextPage: true,
    });

    await expect(
      fetchContent({ collection: "indicators", locale: "en", fetchImpl: fetchImpl as never }),
    ).rejects.toThrow(/paginated/);
  });
});
