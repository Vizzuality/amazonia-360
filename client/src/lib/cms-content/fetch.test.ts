import { assertComplete, buildContentUrl, fetchContent } from "./fetch";

describe("buildContentUrl", () => {
  test("disables pagination, which is the failure this migration must avoid", () => {
    const url = buildContentUrl({ collection: "indicators", locale: "es" });

    // Without limit=0 Payload returns 10 of 164 with no error at all.
    expect(url).toContain("limit=0");
    expect(url).toContain("locale=es");
    expect(url).toContain("depth=0");
    expect(url).toContain("fallback-locale=en");
    expect(url).toMatch(/^\/v1\/api\/indicators\?/);
  });

  test("accepts an absolute base for server-side callers", () => {
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
  test("returns the docs when the response is whole", () => {
    expect(assertComplete("indicators", { docs: [1, 2, 3], totalDocs: 3 })).toEqual([1, 2, 3]);
  });

  test("refuses a paginated response rather than silently losing records", () => {
    expect(() =>
      assertComplete("indicators", {
        docs: new Array(10).fill(0),
        totalDocs: 164,
        hasNextPage: true,
      }),
    ).toThrow(/paginated \(10 of 164\)/);
  });

  test("refuses a short response even without a next-page flag", () => {
    expect(() => assertComplete("indicators", { docs: [1, 2], totalDocs: 164 })).toThrow(
      /got 2 records but the API reports 164/,
    );
  });

  test("rejects a malformed response", () => {
    expect(() => assertComplete("topics", {} as never)).toThrow(/no docs array/);
  });

  test("tolerates a response with no totalDocs", () => {
    expect(assertComplete("topics", { docs: [1] })).toEqual([1]);
  });
});

describe("fetchContent", () => {
  const ok = (body: unknown) =>
    vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => body } as Response);

  test("returns every record", async () => {
    const fetchImpl = ok({ docs: [{ id: 0 }, { id: 1 }], totalDocs: 2 });

    await expect(
      fetchContent({ collection: "topics", locale: "en", fetchImpl: fetchImpl as never }),
    ).resolves.toEqual([{ id: 0 }, { id: 1 }]);
  });

  test("throws on a failed request instead of returning nothing", async () => {
    const fetchImpl = vi.fn().mockResolvedValue({ ok: false, status: 500 } as Response);

    await expect(
      fetchContent({ collection: "indicators", locale: "en", fetchImpl: fetchImpl as never }),
    ).rejects.toThrow(/failed with 500/);
  });

  test("throws when the catalogue comes back truncated", async () => {
    const fetchImpl = ok({ docs: new Array(10).fill({}), totalDocs: 164, hasNextPage: true });

    await expect(
      fetchContent({ collection: "indicators", locale: "en", fetchImpl: fetchImpl as never }),
    ).rejects.toThrow(/paginated/);
  });
});
